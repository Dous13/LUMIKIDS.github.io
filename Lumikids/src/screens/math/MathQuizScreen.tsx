import React, { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";

import { mathQuizzes } from "../../data/mathQuizzes";
import { mathLessons } from "../../data/mathLessons";
import { RootStackParamList } from "../../types/navigation";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { getSession } from "../../services/session/session";
import {
  completeMathLesson,
  isMathLessonCompleted,
  saveMathQuizProgress,
  unlockNextMathLesson,
} from "../../services/database/localMath";
import { awardLocalCoins, awardLocalMathXP } from "../../services/database/localStudent";

type Route = RouteProp<RootStackParamList, "MathQuiz">;

type Feedback = "correct" | "wrong" | "error" | "failed" | null;

export default function MathQuizScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const lessonId = route.params.lessonId;

  const questions = useMemo(
    () => mathQuizzes.filter(q => q.lessonId === lessonId),
    [lessonId]
  );
  const lesson = mathLessons.find(l => l.id === lessonId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [message, setMessage] = useState("");
  const [leavePrompt, setLeavePrompt] = useState(false);
  const [finishing, setFinishing] = useState(false);

  if (!lesson || questions.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Quiz not found.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];
  const percentage = ((currentIndex + 1) / questions.length) * 100;

  async function finishQuiz(finalScore: number) {
    setFinishing(true);
    const session = await getSession();

    if (!session) {
      setFeedback("error");
      setMessage("We couldn't find your student session. Please return to the home screen and try again.");
      setFinishing(false);
      return;
    }

    const result = evaluateQuiz(finalScore, questions.length);
    saveMathQuizProgress(session.studentId, lessonId, finalScore, questions.length);

    if (!result.passed) {
      setFeedback("failed");
      setMessage(result.message || "Let's review this lesson and try again.");
      setAnswerLocked(false);
      setFinishing(false);
      return;
    }

    const alreadyCompleted = isMathLessonCompleted(session.studentId, lessonId);
    const nextLessonIndex = mathLessons.findIndex(item => item.id === lessonId) + 1;
    const hasNextLesson = nextLessonIndex < mathLessons.length;

    let xpEarned = 0;
    const coinsEarned = result.stars * 5;

    if (!alreadyCompleted) {
      xpEarned = lesson!.xpReward;
      awardLocalMathXP(session.studentId, xpEarned);
      awardLocalCoins(session.studentId, coinsEarned);
    }

    completeMathLesson(
      session.studentId,
      lessonId,
      finalScore,
      questions.length,
      result.stars,
      xpEarned
    );
    unlockNextMathLesson(session.studentId, lessonId);

    navigation.replace("MathResult", {
      lessonId,
      score: finalScore,
      total: questions.length,
      xp: xpEarned,
      coins: alreadyCompleted ? 0 : coinsEarned,
      stars: result.stars,
      unlocked: hasNextLesson,
    });
  }

  function chooseAnswer(choice: string) {
    if (answerLocked || finishing) return;

    setAnswerLocked(true);
    setSelectedAnswer(choice);

    const correct = choice === question.correctAnswer;
    const nextScore = correct ? score + 1 : score;
    if (correct) {
      setScore(nextScore);
      setFeedback("correct");
      setMessage("Amazing job! You got it right. 🎉");
    } else {
      setFeedback("wrong");
      setMessage(`The correct answer is ${question.correctAnswer}. Keep practicing! 💪`);
    }
  }

  async function handleNext() {
    if (!answerLocked || finishing) return;

    if (currentIndex === questions.length - 1) {
      const finalScore = score + (selectedAnswer === question.correctAnswer ? 0 : 0);
      await finishQuiz(finalScore);
      return;
    }

    setCurrentIndex(index => index + 1);
    setAnswerLocked(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setMessage("");
  }

  return (
    <LinearGradient colors={["#F8FCFF", "#EAF8FF", "#FFF9E6"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setLeavePrompt(true)}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>🌈 Math Quiz</Text>
              <Text style={styles.subtitle}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>

          {leavePrompt && (
            <View style={styles.promptCard}>
              <Text style={styles.promptTitle}>Leave the quiz?</Text>
              <Text style={styles.promptText}>Your current answers will not count as a completed lesson.</Text>
              <View style={styles.promptButtons}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setLeavePrompt(false)}>
                  <Text style={styles.secondaryButtonText}>Keep Playing</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.dangerButtonText}>Leave</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {feedback && (
            <View style={[styles.feedback, feedback === "correct" ? styles.correct : feedback === "wrong" ? styles.wrong : styles.notice]}>
              <Text style={styles.feedbackTitle}>
                {feedback === "correct" ? "🎉 Great job!" : feedback === "wrong" ? "💪 Almost!" : feedback === "failed" ? "Let's practice again" : "Something went wrong"}
              </Text>
              <Text style={styles.feedbackText}>{message}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.question}>{question.question}</Text>
            <Text style={styles.emoji}>{question.emoji}</Text>

            <View style={styles.options}>
              {question.options.map(option => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === question.correctAnswer;
                const stateStyle = answerLocked && isSelected
                  ? isCorrect ? styles.correctOption : styles.wrongOption
                  : undefined;

                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.option, stateStyle]}
                    activeOpacity={0.88}
                    disabled={answerLocked || finishing}
                    onPress={() => chooseAnswer(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                    {answerLocked && isSelected && (
                      <Text style={styles.optionIcon}>{isCorrect ? "✓" : "✕"}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.score}>⭐ Score: {score}</Text>

            {feedback && feedback !== "failed" && feedback !== "error" && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext} disabled={finishing}>
                <Text style={styles.primaryButtonText}>
                  {currentIndex === questions.length - 1 ? "Finish Quiz 🎉" : "Next →"}
                </Text>
              </TouchableOpacity>
            )}

            {feedback === "failed" && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace("MathLesson", { lessonId })}>
                <Text style={styles.primaryButtonText}>Review Lesson</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  error: { fontSize: 20, fontWeight: "800", color: "#64748B", marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center" },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", elevation: 4 },
  backArrow: { fontSize: 27, fontWeight: "800", color: "#4A90E2" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 48 },
  title: { fontSize: 27, fontWeight: "900", color: "#2563EB" },
  subtitle: { marginTop: 2, fontSize: 14, fontWeight: "700", color: "#64748B" },
  progressTrack: { height: 13, backgroundColor: "#D7EAF8", borderRadius: 20, overflow: "hidden", marginTop: 16, marginBottom: 16 },
  progressFill: { height: "100%", backgroundColor: "#62C77A", borderRadius: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 30, padding: 22, alignItems: "center", elevation: 5 },
  question: { fontSize: 25, lineHeight: 32, fontWeight: "900", textAlign: "center", color: "#334155" },
  emoji: { fontSize: 62, marginVertical: 18 },
  options: { width: "100%", gap: 12 },
  option: { minHeight: 58, backgroundColor: "#EAF8FF", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, borderWidth: 2, borderColor: "#CFEAFF", justifyContent: "center", alignItems: "center", flexDirection: "row" },
  correctOption: { backgroundColor: "#DDF8E4", borderColor: "#65C97A" },
  wrongOption: { backgroundColor: "#FFE4E4", borderColor: "#F28B8B" },
  optionText: { fontSize: 23, fontWeight: "900", color: "#275B8F", textAlign: "center" },
  optionIcon: { position: "absolute", right: 16, fontSize: 23, fontWeight: "900" },
  score: { marginTop: 18, fontSize: 16, fontWeight: "800", color: "#64748B" },
  feedback: { borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1 },
  correct: { backgroundColor: "#E7F9EB", borderColor: "#B9E8C2" },
  wrong: { backgroundColor: "#FFF1E6", borderColor: "#FFD0AA" },
  notice: { backgroundColor: "#EEF6FF", borderColor: "#CDE3FF" },
  feedbackTitle: { fontSize: 18, fontWeight: "900", color: "#334155" },
  feedbackText: { marginTop: 4, fontSize: 15, lineHeight: 21, color: "#64748B" },
  primaryButton: { width: "100%", marginTop: 18, backgroundColor: "#4DA8FF", borderRadius: 20, paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { color: "#FFF", fontSize: 19, fontWeight: "900" },
  promptCard: { backgroundColor: "#FFF", borderRadius: 22, padding: 16, marginBottom: 14, elevation: 4 },
  promptTitle: { fontSize: 19, fontWeight: "900", color: "#334155" },
  promptText: { marginTop: 5, color: "#64748B", lineHeight: 20 },
  promptButtons: { flexDirection: "row", gap: 10, marginTop: 14 },
  secondaryButton: { flex: 1, backgroundColor: "#EAF8FF", borderRadius: 16, paddingVertical: 13, alignItems: "center" },
  secondaryButtonText: { color: "#275B8F", fontWeight: "800" },
  dangerButton: { flex: 1, backgroundColor: "#FFE4E4", borderRadius: 16, paddingVertical: 13, alignItems: "center" },
  dangerButtonText: { color: "#B91C1C", fontWeight: "800" },
});
