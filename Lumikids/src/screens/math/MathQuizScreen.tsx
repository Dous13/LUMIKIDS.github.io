import { Colors } from "../../theme";
import AnimatedProgress from "../../components/common/AnimatedProgress";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useMemo, useRef, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import ExitLessonModal from "../../components/common/ExitLessonModal";
import { useExitLessonGuard } from "../../hooks/useExitLessonGuard";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { mathQuizzes } from "../../data/mathQuizzes";
import { mathLessons } from "../../data/mathLessons";
import { RootStackParamList } from "../../types/navigation";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { getSession } from "../../services/session/session";
import {
  completeMathLesson,
  isMathLessonCompleted,
  saveMathQuizProgress,
} from "../../services/database/localMath";
import {
  awardLocalCoins,
  awardLocalMathXP,
} from "../../services/database/localStudent";
import { recordMistake } from "../../services/database/localMistakes";

type Route = RouteProp<RootStackParamList, "MathQuiz">;

type Feedback = "correct" | "wrong" | "error" | "failed" | null;

export default function MathQuizScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const exitGuard = useExitLessonGuard(() => navigation.goBack());

  const lessonId = route.params.lessonId;

  const questions = useMemo(
    () => mathQuizzes.filter(q => q.lessonId === lessonId),
    [lessonId]
  );

  const lesson = mathLessons.find(l => l.id === lessonId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [message, setMessage] = useState("");
  const [finishing, setFinishing] = useState(false);

  if (!lesson || questions.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Quiz not found.</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={exitGuard.requestExit}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentLesson = lesson;
  const question = questions[currentIndex];

  const percentage =
    ((currentIndex + 1) / questions.length) * 100;

  async function finishQuiz(finalScore: number) {
    if (finishing) return;

    setFinishing(true);

    try {
      const session = await getSession();

      if (!session) {
        setFeedback("error");
        setMessage(
          "We couldn't find your student session. Please return to the home screen and try again."
        );
        return;
      }

      console.log("[MathQuiz] Score being evaluated:", {
        finalScore,
        totalQuestions: questions.length,
      });

      const result = evaluateQuiz(finalScore, questions.length);

      // Save the assessment result locally.
      await saveMathQuizProgress(
        session.studentId,
        lessonId,
        finalScore,
        questions.length
      );

      if (!result.passed) {
        navigation.replace("RemedialQuiz", {
          subject: "math",
          lessonId,
        });
        return;
      }

      const alreadyCompleted = isMathLessonCompleted(
        session.studentId,
        lessonId
      );

      const xpEarned = alreadyCompleted
        ? 0
        : currentLesson.xpReward;

      const coinsEarned = alreadyCompleted
        ? 0
        : result.stars * 5;

      const completed = await completeMathLesson(
        session.studentId,
        lessonId,
        finalScore,
        questions.length,
        result.stars,
        xpEarned
      );

      if (!completed) {
        setFeedback("failed");
        setMessage("Let's practice some more before moving on!");
        return;
      }

      if (!alreadyCompleted) {
        await awardLocalMathXP(session.studentId, xpEarned);
        await awardLocalCoins(session.studentId, coinsEarned);
      }

      const lessonIndex = mathLessons.findIndex(
        item => item.id === lessonId
      );

      const hasNextLesson =
        lessonIndex >= 0 &&
        lessonIndex < mathLessons.length - 1;

      navigation.replace("MathResult", {
        lessonId,
        score: finalScore,
        total: questions.length,
        xp: xpEarned,
        coins: coinsEarned,
        stars: result.stars,
        unlocked: hasNextLesson,
      });
    } catch (error) {
      console.error("[MathQuiz] Failed to finish quiz:", error);

      setFeedback("error");
      setMessage(
        "Something went wrong while saving your progress. Please try again."
      );
    } finally {
      setFinishing(false);
    }
  }

  async function chooseAnswer(choice: string) {
    if (answerLocked || finishing) return;

    setAnswerLocked(true);
    setSelectedAnswer(choice);

    const correct = choice === question.correctAnswer;

    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);

      setFeedback("correct");
      setMessage("Amazing job! You got it right. 🎉");
      return;
    }

    try {
      const session = await getSession();

      if (session) {
        await recordMistake(
          session.studentId,
          "math",
          lessonId,
          currentIndex,
          question.question,
          choice,
          question.correctAnswer,
          question.skillId
        );
      }
    } catch (error) {
      console.error("[MathQuiz] Could not record mistake:", error);
    }

    setFeedback("wrong");
    setMessage(
      `The correct answer is ${question.correctAnswer}. Keep practicing! 💪`
    );
  }

  async function handleNext() {
    if (!answerLocked || finishing) return;

    if (currentIndex === questions.length - 1) {
      await finishQuiz(scoreRef.current);
      return;
    }

    setCurrentIndex(index => index + 1);
    setAnswerLocked(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setMessage("");
  }

  return (
    <LinearGradient
      colors={[Colors.background, Colors.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={exitGuard.requestExit}
              disabled={finishing}
            >
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

          <AnimatedProgress value={percentage} color={Colors.math} style={styles.progressTrack} />

          {feedback && (
            <View
              style={[
                styles.feedback,
                feedback === "correct"
                  ? styles.correct
                  : feedback === "wrong"
                    ? styles.wrong
                    : styles.notice,
              ]}
            >
              <Text style={styles.feedbackTitle}>
                {feedback === "correct"
                  ? "🎉 Great job!"
                  : feedback === "wrong"
                    ? "💪 Almost!"
                    : feedback === "failed"
                      ? "Let's practice again"
                      : "Something went wrong"}
              </Text>

              <Text style={styles.feedbackText}>{message}</Text>
            </View>
          )}

          <FadeIn style={styles.card}>
            <Text style={styles.question}>{question.question}</Text>

            <Text style={styles.emoji}>{question.emoji}</Text>

            <View style={styles.options}>
              {question.options.map(option => {
                const isSelected = selectedAnswer === option;
                const isCorrect =
                  option === question.correctAnswer;

                const stateStyle =
                  answerLocked && isSelected
                    ? isCorrect
                      ? styles.correctOption
                      : styles.wrongOption
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
                      <Text style={styles.optionIcon}>
                        {isCorrect ? "✓" : "✕"}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.score}>⭐ Score: {score}</Text>

            {feedback &&
              feedback !== "failed" &&
              feedback !== "error" && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNext}
                  disabled={finishing}
                >
                  <Text style={styles.primaryButtonText}>
                    {finishing
                      ? "Saving..."
                      : currentIndex === questions.length - 1
                        ? "Finish Quiz 🎉"
                        : "Next →"}
                  </Text>
                </TouchableOpacity>
              )}

            {feedback === "failed" && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  navigation.replace("MathLesson", { lessonId })
                }
              >
                <Text style={styles.primaryButtonText}>
                  Review Lesson
                </Text>
              </TouchableOpacity>
            )}

            {feedback === "error" && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => finishQuiz(scoreRef.current)}
                disabled={finishing}
              >
                <Text style={styles.primaryButtonText}>
                  {finishing ? "Saving..." : "Try Saving Again"}
                </Text>
              </TouchableOpacity>
            )}
          </FadeIn>
        </ScrollView>

        <ExitLessonModal
          visible={exitGuard.visible}
          onStay={exitGuard.stay}
          onLeave={exitGuard.leave}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36, width: "100%", maxWidth: 720, alignSelf: "center" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  error: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, justifyContent: "center", alignItems: "center", elevation: 1, borderWidth: 1, borderColor: Colors.mathBorder },
  backArrow: { fontSize: 27, fontWeight: "800", color: Colors.math },
  headerCenter: { flex: 1, alignItems: "center", minWidth: 0 },
  headerSpacer: { width: 48 },
  title: { fontSize: 25, fontWeight: "800", color: Colors.math, lineHeight: 32, textAlign: "center", flexShrink: 1 },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 13,
    backgroundColor: "#D7EAF8",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#62C77A",
    borderRadius: 20,
  },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: "center", elevation: 1, borderWidth: 1, borderColor: Colors.mathBorder, borderBottomWidth: 3 },
  question: { fontSize: 25, lineHeight: 32, fontWeight: "800", textAlign: "center", color: Colors.text },
  emoji: {
    fontSize: 62,
    marginVertical: 18,
  },
  options: {
    width: "100%",
    gap: 12,
  },
  option: { minHeight: 58, backgroundColor: Colors.white, borderRadius: 16, paddingHorizontal: 40, paddingVertical: 14, borderWidth: 2, borderColor: Colors.mathBorder, justifyContent: "center", alignItems: "center", flexDirection: "row", elevation: 1, borderBottomWidth: 3 },
  correctOption: { backgroundColor: Colors.successSurface, borderColor: Colors.math },
  wrongOption: { backgroundColor: Colors.errorSurface, borderColor: "#C96859" },
  optionText: { fontSize: 23, fontWeight: "800", color: "#275B8F", textAlign: "center", flexShrink: 1 },
  optionIcon: {
    position: "absolute",
    right: 16,
    fontSize: 23,
    fontWeight: "900",
  },
  score: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textSecondary,
  },
  feedback: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  correct: {
    backgroundColor: "#E7F9EB",
    borderColor: "#B9E8C2",
  },
  wrong: {
    backgroundColor: "#FFF1E6",
    borderColor: "#FFD0AA",
  },
  notice: {
    backgroundColor: "#EEF6FF",
    borderColor: "#CDE3FF",
  },
  feedbackTitle: { fontSize: 18, fontWeight: "800", color: Colors.text },
  feedbackText: { marginTop: 4, fontSize: 16, lineHeight: 23, color: Colors.textSecondary },
  primaryButton: { width: "100%", marginTop: 18, backgroundColor: Colors.math, borderRadius: 16, paddingVertical: 16, alignItems: "center", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.mathDark },
  primaryButtonText: { color: Colors.white, fontSize: 19, fontWeight: "800", lineHeight: 26, textAlign: "center" },
  promptCard: { backgroundColor: Colors.white, borderRadius: 22, padding: 16, marginBottom: 14, elevation: 1, borderWidth: 1, borderColor: Colors.mathBorder },
  promptTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: Colors.text,
  },
  promptText: {
    marginTop: 5,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  promptButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: { flex: 1, backgroundColor: "#EAF8FF", borderRadius: 16, paddingVertical: 13, alignItems: "center", minHeight: 48 },
  secondaryButtonText: {
    color: "#275B8F",
    fontWeight: "800",
  },
  dangerButton: { flex: 1, backgroundColor: "#FFE4E4", borderRadius: 16, paddingVertical: 13, alignItems: "center", minHeight: 48 },
  dangerButtonText: {
    color: "#B91C1C",
    fontWeight: "800",
  },
});
