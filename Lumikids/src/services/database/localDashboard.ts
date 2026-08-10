import { getAllProgress } from "./localProgress";
import { getAllWritingProgress } from "./localWriting";
import { getAllMathProgress } from "./localMath";
import { getAllMistakes } from "./localMistakes";
import { getLocalStudent } from "./localStudent";

export interface DashboardSummary {
  totalLessons: number;
  completedLessons: number;
  totalStars: number;
  readingCompleted: number;
  writingCompleted: number;
  mathCompleted: number;
  readingScore: number;
  readingTotal: number;
  mathScore: number;
  mathTotal: number;
  quizAccuracy: number;
  mistakes: number;
  xp: number;
  coins: number;
  level: number;
}

export function getDashboardSummary(studentId: string): DashboardSummary {
  const student = getLocalStudent(studentId);
  const reading = getAllProgress(studentId) as any[];
  const writing = getAllWritingProgress(studentId) as any[];
  const math = getAllMathProgress(studentId) as any[];
  const mistakes = getAllMistakes(studentId);

  const readingScore = reading.reduce((sum, item) => sum + (item.quizScore ?? 0), 0);
  const readingTotal = reading.reduce((sum, item) => sum + (item.quizTotal ?? 0), 0);
  const mathScore = math.reduce((sum, item) => sum + (item.quizScore ?? 0), 0);
  const mathTotal = math.reduce((sum, item) => sum + (item.quizTotal ?? 0), 0);
  const quizScore = readingScore + mathScore;
  const quizTotal = readingTotal + mathTotal;
  const completed = (rows: any[]) =>
    rows.filter(item => item.completed === 1).length;

  const totalStars =
    [...reading, ...writing, ...math].reduce(
      (sum, item) => sum + (item.stars ?? 0),
      0
    );

  return {
    totalLessons: reading.length + writing.length + math.length,
    completedLessons:
      completed(reading) + completed(writing) + completed(math),
    totalStars,
    readingCompleted: completed(reading),
    writingCompleted: completed(writing),
    mathCompleted: completed(math),
    readingScore,
    readingTotal,
    mathScore,
    mathTotal,
    quizAccuracy:
      quizTotal > 0 ? Math.round((quizScore / quizTotal) * 100) : 0,
    mistakes: mistakes.reduce((sum, item) => sum + item.count, 0),
    xp: student?.xp ?? 0,
    coins: student?.coins ?? 0,
    level: student?.level ?? 1,
  };
}
