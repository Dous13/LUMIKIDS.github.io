
import { Student } from "../../types/Student";
import { generateStudentId } from "../auth/auth";

export function createStudentProfile(
  name: string,
  classCode: string
): Student {
  const studentId = generateStudentId();

  return {
    studentId,
    id: studentId,
    name,
    classCode,

    xp: 0,
    coins: 0,
    stars: 0,

    level: 1,
    streak: 0,

    readingXP: 0,
    writingXP: 0,
    mathXP: 0,

    readingProgress: 0,
    writingProgress: 0,
    mathProgress: 0,

    avatar: "bear",
    createdAt: new Date(),
  };
}
