import { Colors } from "../../theme";
import AnimatedProgress from "../../components/common/AnimatedProgress";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import ExitLessonModal from "../../components/common/ExitLessonModal";
import { useExitLessonGuard } from "../../hooks/useExitLessonGuard";
import { readingQuizzes } from "../../data/readingQuizzes";
import { RootStackParamList } from "../../types/navigation";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { getSession } from "../../services/session/session";
import { readingLessons } from "../../data/readingLessons";
import {
  awardLocalReadingXP,
  awardLocalCoins,
} from "../../services/database/localStudent";
import {
  completeLesson,
  unlockNextLesson,
  isLessonCompleted,
  getAllProgress,
} from "../../services/database/localProgress";
import { recordMistake } from "../../services/database/localMistakes";


type QuizRouteProp = RouteProp<RootStackParamList, "Quiz">;

export default function QuizScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<QuizRouteProp>();
  const exitGuard = useExitLessonGuard(() => navigation.goBack());

  const lessonId = route.params.lessonId;
  const lesson = readingLessons.find((item) => item.id === lessonId);
  const quiz = readingQuizzes[lessonId as keyof typeof readingQuizzes];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (!lesson || !quiz || quiz.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Quiz not found.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const validLesson = lesson;
  const validQuiz = quiz;
  const question = validQuiz[currentQuestion];

  async function finishQuiz(finalScore: number) {
    const result = evaluateQuiz(finalScore, quiz.length);

    if (!result.passed) {
      navigation.replace("RemedialQuiz", {
        subject: "reading",
        lessonId,
      });
      return;
    }

    const session = await getSession();

    if (!session) {
      setMessage(
        "We couldn't find your student session. Please return home and try again."
      );
      return;
    }

    const alreadyCompleted = isLessonCompleted(
      session.studentId,
      lessonId
    );

    const currentIndex = readingLessons.findIndex(
      (item) => item.id === lessonId
    );
    const nextLesson = readingLessons[currentIndex + 1];

    if (!alreadyCompleted) {
      awardLocalReadingXP(session.studentId, validLesson.xp);
      awardLocalCoins(session.studentId, validLesson.coins);
    }

    completeLesson(
      session.studentId,
      lessonId,
      result.stars,
      finalScore,
      quiz.length
    );

    unlockNextLesson(session.studentId, lessonId);
    
console.log(
  "[READING] Progress after unlock:",
  getAllProgress(session.studentId)
);

    navigation.replace("Reward", {
      subject: "reading",
      lessonId,
      xp: alreadyCompleted ? 0 : validLesson.xp,
      coins: alreadyCompleted ? 0 : validLesson.coins,
      stars: result.stars,
      unlocked: !!nextLesson,
      levelUp: false,
    });
  }

  async function chooseAnswer(choice: string) {
    if (locked) return;

    setSelected(choice);
    setLocked(true);

    const correct = choice === question.answer;

    if (!correct) {
      const session = await getSession();

      if (session) {
      recordMistake(
        session.studentId,
        "reading",
        lessonId,
        currentQuestion,
        question.question,
        choice,
        question.answer,
        question.skillId
      );
      }

      setMessage(
        "😊 Almost! The highlighted answer shows what to look for. Try the next question."
      );
      return;
    }

    setScore((previousScore) => previousScore + 1);
    setMessage("⭐ Correct! Great job.");
  }

  async function nextQuestion() {
    if (!locked) return;

    if (currentQuestion === quiz.length - 1) {
      await finishQuiz(score);
      return;
    }

    setCurrentQuestion((value) => value + 1);
    setSelected(null);
    setLocked(false);
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
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={exitGuard.requestExit}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.backText}>Lesson</Text>
          </TouchableOpacity>

          <Text style={styles.title}>🌈 Reading Quiz</Text>

          <Text style={styles.progress}>
            Question {currentQuestion + 1} of {quiz.length}
          </Text>

          <AnimatedProgress value={((currentQuestion + 1) / quiz.length) * 100} color={Colors.reading} style={styles.progressBar} />

          {message ? (
            <View
              style={[
                styles.feedback,
                message.startsWith("⭐")
                  ? styles.good
                  : styles.notice,
              ]}
            >
              <Text style={styles.feedbackText}>{message}</Text>
            </View>
          ) : null}

          <FadeIn style={styles.questionCard}>
            <Text style={styles.question}>
              {question.question}
            </Text>

            {question.image ? (
              <Text style={styles.image}>{question.image}</Text>
            ) : null}
          </FadeIn>

          {question.choices.map((choice) => {
            const selectedChoice = selected === choice;
            const correctChoice = choice === question.answer;

            return (
              <TouchableOpacity
                key={choice}
                style={[
                  styles.choice,
                  locked &&
                    correctChoice &&
                    styles.correctChoice,
                  locked &&
                    selectedChoice &&
                    !correctChoice &&
                    styles.wrongChoice,
                ]}
                disabled={locked}
                onPress={() => chooseAnswer(choice)}
              >
                <Text style={styles.choiceText}>{choice}</Text>

                {locked && correctChoice ? (
                  <Text style={styles.icon}>✓</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}

          {locked ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={nextQuestion}
            >
              <Text style={styles.nextText}>
                {currentQuestion === quiz.length - 1
                  ? "Finish Quiz 🎉"
                  : "Next →"}
              </Text>
            </TouchableOpacity>
          ) : null}
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
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textSecondary,
  },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, marginTop: 18, alignItems: "center", minHeight: 52 },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 8, minHeight: 44 },
  backText: {
    marginLeft: 7,
    fontSize: 17,
    fontWeight: "800",
    color: Colors.primary,
  },
  title: { marginTop: 8, fontSize: 28, fontWeight: "800", color: Colors.reading, textAlign: "center", lineHeight: 36 },
  progress: { marginTop: 5, textAlign: "center", color: Colors.textSecondary, fontWeight: "700", fontSize: 15, lineHeight: 22 },
  progressBar: {
    height: 12,
    backgroundColor: "#D7EAF8",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 15,
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#62C77A",
  },
  feedback: {
    borderRadius: 18,
    padding: 13,
    marginBottom: 12,
  },
  good: {
    backgroundColor: "#E7F9EB",
  },
  notice: {
    backgroundColor: "#FFF1E6",
  },
  feedbackText: { color: Colors.text, fontWeight: "700", lineHeight: 23, fontSize: 16 },
  questionCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: "center", elevation: 1, borderWidth: 1, borderColor: Colors.readingBorder, borderBottomWidth: 3 },
  question: { fontSize: 24, lineHeight: 31, fontWeight: "800", color: Colors.text, textAlign: "center" },
  image: {
    fontSize: 62,
    marginTop: 15,
  },
  choice: { minHeight: 58, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 2, borderColor: Colors.readingBorder, marginTop: 12, padding: 15, justifyContent: "center", alignItems: "center", flexDirection: "row", elevation: 1, borderBottomWidth: 3, paddingHorizontal: 40 },
  correctChoice: { backgroundColor: Colors.successSurface, borderColor: Colors.math },
  wrongChoice: { backgroundColor: Colors.errorSurface, borderColor: "#C96859" },
  choiceText: { fontSize: 22, fontWeight: "800", color: "#275B8F", textAlign: "center", flexShrink: 1 },
  icon: {
    position: "absolute",
    right: 16,
    fontSize: 22,
    fontWeight: "900",
  },
  nextButton: { backgroundColor: Colors.reading, borderRadius: 16, paddingVertical: 16, marginTop: 18, alignItems: "center", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.readingDark },
  nextText: { color: Colors.white, fontSize: 19, fontWeight: "800", lineHeight: 26, textAlign: "center" },
});
