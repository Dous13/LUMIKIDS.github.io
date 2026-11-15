import FadeIn from "../../components/common/FadeIn";
import { Colors } from "../../theme";
import AnimatedProgress from "../../components/common/AnimatedProgress";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { RootStackParamList } from "../../types/navigation";
import { getRemedialQuestions } from "../../data/remedialQuizzes";
import { evaluateQuiz } from "../../utils/ruleEngine";

type Route = RouteProp<RootStackParamList, "RemedialQuiz">;

export default function RemedialQuizScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();

  const { subject, lessonId } = route.params;

  const questions = getRemedialQuestions(subject, lessonId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);
  const [message, setMessage] = useState("");

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Practice unavailable</Text>
        <Text style={styles.message}>
          There are no additional practice questions for this lesson yet.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question = questions[currentIndex];

  function chooseAnswer(choice: string) {
    if (locked || finished) return;

    setSelected(choice);
    setLocked(true);

    if (choice === question.answer) {
      setScore(previous => previous + 1);
      setMessage("⭐ Great job! That's correct.");
    } else {
      setMessage(
        `💪 Keep learning! The correct answer is ${question.answer}.`
      );
    }
  }

  function finishRemedial(finalScore: number) {
    const result = evaluateQuiz(finalScore, questions.length);

    setFinished(true);
    setPassed(result.passed);
    setMessage(
      result.passed
        ? "Wonderful! You completed the practice. Try the lesson quiz again!"
        : "You're getting there! Let's practice these skills again."
    );
  }

  function nextQuestion() {
    if (!locked) return;

    if (currentIndex === questions.length - 1) {
      finishRemedial(score);
      return;
    }

    setCurrentIndex(previous => previous + 1);
    setSelected(null);
    setLocked(false);
    setMessage("");
  }

  function continueAfterRemedial() {
    if (!passed) {
      setCurrentIndex(0);
      setScore(0);
      setSelected(null);
      setLocked(false);
      setFinished(false);
      setPassed(false);
      setMessage("");
      return;
    }

    if (subject === "reading") {
      navigation.replace("Quiz", { lessonId: String(lessonId) });
    } else {
      navigation.replace("MathQuiz", { lessonId: Number(lessonId) });
    }
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
          <Text style={styles.badge}>🌱 EXTRA PRACTICE</Text>

          <Text style={styles.title}>
            {subject === "reading"
              ? "Reading Practice"
              : "Math Practice"}
          </Text>

          <Text style={styles.subtitle}>
            Let's practice together. You can do it!
          </Text>

          {!finished && (
            <>
              <Text style={styles.progress}>
                Question {currentIndex + 1} of {questions.length}
              </Text>

              <AnimatedProgress value={((currentIndex + 1) / questions.length) * 100} color={Colors.primary} style={styles.progressTrack} />

              {message ? (
                <View
                  style={[
                    styles.feedback,
                    selected === question.answer
                      ? styles.correctFeedback
                      : styles.noticeFeedback,
                  ]}
                >
                  <Text style={styles.feedbackText}>{message}</Text>
                </View>
              ) : null}

              <FadeIn style={styles.card}>
                <Text style={styles.question}>
                  {question.question}
                </Text>

                {(question.image || question.emoji) ? (
                  <Text style={styles.emoji}>
                    {question.image || question.emoji}
                  </Text>
                ) : null}

                <View style={styles.options}>
                  {question.choices.map(choice => {
                    const isSelected = selected === choice;
                    const isCorrect = choice === question.answer;

                    return (
                      <TouchableOpacity
                        key={choice}
                        style={[
                          styles.option,
                          locked && isCorrect && styles.correctOption,
                          locked &&
                            isSelected &&
                            !isCorrect &&
                            styles.wrongOption,
                        ]}
                        disabled={locked}
                        onPress={() => chooseAnswer(choice)}
                      >
                        <Text style={styles.optionText}>{choice}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {locked && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={nextQuestion}
                  >
                    <Text style={styles.buttonText}>
                      {currentIndex === questions.length - 1
                        ? "Finish Practice"
                        : "Next Question"}
                    </Text>
                  </TouchableOpacity>
                )}
              </FadeIn>
            </>
          )}

          {finished && (
            <FadeIn style={styles.card}>
              <Text style={styles.resultEmoji}>
                {passed ? "🎉" : "🌟"}
              </Text>

              <Text style={styles.resultTitle}>
                {passed ? "Great Work!" : "Keep Practicing!"}
              </Text>

              <Text style={styles.score}>
                Your score: {score} / {questions.length}
              </Text>

              <Text style={styles.message}>{message}</Text>

              <TouchableOpacity
                style={styles.button}
                onPress={continueAfterRemedial}
              >
                <Text style={styles.buttonText}>
                  {passed ? "Try the Lesson Quiz" : "Practice Again"}
                </Text>
              </TouchableOpacity>
            </FadeIn>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: "#DDF8E4",
    color: "#27834A",
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: "900",
    marginTop: 12,
  },
  title: { fontSize: 29, fontWeight: "800", color: Colors.text, textAlign: "center", marginTop: 14, lineHeight: 36 },
  subtitle: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 20,
  },
  progress: { textAlign: "center", color: Colors.textSecondary, fontWeight: "700", fontSize: 15, lineHeight: 22 },
  progressTrack: {
    height: 12,
    backgroundColor: "#D7EAF8",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 18,
  },
  progressFill: { height: "100%", backgroundColor: Colors.primary },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 22, alignItems: "center", elevation: 1, borderWidth: 1, borderColor: "#E1E7E5", borderBottomWidth: 3 },
  question: { fontSize: 23, fontWeight: "800", color: Colors.text, textAlign: "center" },
  emoji: {
    fontSize: 58,
    marginVertical: 20,
    textAlign: "center",
  },
  options: {
    width: "100%",
    gap: 12,
  },
  option: { minHeight: 56, borderRadius: 16, borderWidth: 2, borderColor: "#E1E7E5", backgroundColor: Colors.white, justifyContent: "center", alignItems: "center", padding: 14, elevation: 1, borderBottomWidth: 3, paddingHorizontal: 20 },
  optionText: { fontSize: 21, fontWeight: "800", color: "#275B8F", textAlign: "center", flexShrink: 1 },
  correctOption: {
    backgroundColor: "#DDF8E4",
    borderColor: "#65C97A",
  },
  wrongOption: {
    backgroundColor: "#FFE4E4",
    borderColor: "#F28B8B",
  },
  feedback: {
    borderRadius: 18,
    padding: 13,
    marginBottom: 14,
  },
  correctFeedback: {
    backgroundColor: "#E7F9EB",
  },
  noticeFeedback: {
    backgroundColor: "#FFF1E6",
  },
  feedbackText: { color: Colors.text, fontWeight: "800", lineHeight: 23, fontSize: 16 },
  button: { width: "100%", marginTop: 20, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },
  buttonText: { color: Colors.white, fontSize: 17, fontWeight: "800", lineHeight: 26, textAlign: "center" },
  resultEmoji: {
    fontSize: 65,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: Colors.primary,
  },
  score: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: "900",
    color: Colors.text,
  },
  message: {
    marginTop: 12,
    textAlign: "center",
    color: Colors.textSecondary,
    fontWeight: "700",
    lineHeight: 22,
  },
});