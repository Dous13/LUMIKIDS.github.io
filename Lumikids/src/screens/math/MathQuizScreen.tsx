import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
  getMathProgress,
  isMathLessonCompleted,
  saveMathQuizProgress,
  unlockNextMathLesson,
} from "../../services/database/localMath";
import {
  awardLocalCoins,
  awardLocalMathXP,
} from "../../services/database/localStudent";

type Route = RouteProp<RootStackParamList, "MathQuiz">;

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

  if (!lesson || questions.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Quiz not found.</Text>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];

  async function finishQuiz(finalScore: number) {
    const session = await getSession();

    if (!session) {
      Alert.alert(
        "Session Error",
        "We could not find the student session."
      );
      return;
    }

    const result = evaluateQuiz(
      finalScore,
      questions.length
    );

    saveMathQuizProgress(
      session.studentId,
      lessonId,
      finalScore,
      questions.length
    );

    if (!result.passed) {
      setAnswerLocked(false);

      Alert.alert(
        "Let's Practice Again! 😊",
        result.message,
        [
          {
            text: "Review Lesson",
            onPress: () =>
              navigation.replace("MathLesson", {
                lessonId,
              }),
          },
        ]
      );
      return;
    }

    const alreadyCompleted = isMathLessonCompleted(
      session.studentId,
      lessonId
    );

    const nextLessonIndex = mathLessons.findIndex(
      item => item.id === lessonId
    ) + 1;

    const hasNextLesson =
      nextLessonIndex < mathLessons.length;

    let xpEarned = 0;
    let coinsEarned = result.stars * 5;

    if (!alreadyCompleted) {
      xpEarned = lesson!.xpReward;

      awardLocalMathXP(
        session.studentId,
        xpEarned
      );

      awardLocalCoins(
        session.studentId,
        coinsEarned
      );
    }

    completeMathLesson(
      session.studentId,
      lessonId,
      finalScore,
      questions.length,
      result.stars,
      xpEarned
    );

    unlockNextMathLesson(
      session.studentId,
      lessonId
    );

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
    if (answerLocked) return;

    setAnswerLocked(true);

    const correct = choice === question.correctAnswer;
    const nextScore = correct ? score + 1 : score;

    if (correct) {
      setScore(nextScore);

      Alert.alert(
        "⭐ Correct!",
        "Amazing job!",
        [
          {
            text: "Next",
            onPress: () => {
              if (currentIndex === questions.length - 1) {
                finishQuiz(nextScore);
              } else {
                setCurrentIndex(index => index + 1);
                setAnswerLocked(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "😊 Almost!",
        "That's okay! Try the next one.",
        [
          {
            text: "Next",
            onPress: () => {
              if (currentIndex === questions.length - 1) {
                finishQuiz(nextScore);
              } else {
                setCurrentIndex(index => index + 1);
                setAnswerLocked(false);
              }
            },
          },
        ]
      );
    }
  }

  const percentage =
    ((currentIndex + 1) / questions.length) * 100;

  return (
    <LinearGradient
      colors={["#F8FCFF", "#EAF8FF", "#FFF9E6"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              Alert.alert(
                "Leave Quiz?",
                "Your quiz answers will not be counted as a completed lesson.",
                [
                  { text: "Keep Playing", style: "cancel" },
                  {
                    text: "Leave",
                    style: "destructive",
                    onPress: () => navigation.goBack(),
                  },
                ]
              )
            }
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

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.question}>
            {question.question}
          </Text>

          <Text style={styles.emoji}>
            {question.emoji}
          </Text>

          <View style={styles.options}>
            {question.options.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.option}
                activeOpacity={0.88}
                disabled={answerLocked}
                onPress={() => chooseAnswer(option)}
              >
                <Text style={styles.optionText}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.score}>
            ⭐ Score: {score}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  error: {
    fontSize: 20,
    fontWeight: "700",
    color: "#64748B",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  backArrow: {
    fontSize: 27,
    fontWeight: "800",
    color: "#4A90E2",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerSpacer: {
    width: 48,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2563EB",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },

  progressTrack: {
    height: 13,
    backgroundColor: "#D7EAF8",
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: 24,
    marginTop: 18,
    marginBottom: 20,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#62C77A",
    borderRadius: 20,
  },

  card: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    elevation: 6,
    alignItems: "center",
  },

  question: {
    marginTop: 8,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
    color: "#334155",
  },

  emoji: {
    fontSize: 72,
    textAlign: "center",
    marginVertical: 22,
  },

  options: {
    width: "100%",
    gap: 14,
  },

  option: {
    backgroundColor: "#EAF8FF",
    borderRadius: 22,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: "#CFEAFF",
    alignItems: "center",
  },

  optionText: {
    fontSize: 25,
    fontWeight: "900",
    color: "#275B8F",
  },

  score: {
    marginTop: 22,
    fontSize: 16,
    fontWeight: "800",
    color: "#64748B",
  },
});
