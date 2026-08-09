import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { mathQuizzes } from "../../data/mathQuizzes";
import { mathLessons } from "../../data/mathLessons";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { getSession } from "../../services/session/session";

import {
  completeMathLesson,
  isMathLessonCompleted,
  saveMathQuizProgress,
  unlockNextMathLesson,
} from "../../services/database/localMath";

import {
  awardLocalCoins,
  awardLocalMathXP,
} from "../../services/database/localStudent";

  type MathQuizRouteProp = RouteProp<
    RootStackParamList,
    "MathQuiz"
  >;

  type MathQuizNavigationProp =
    NativeStackNavigationProp<
      RootStackParamList,
      "MathQuiz"
    >;

export default function MathQuizScreen() {
  const navigation =
    useNavigation<MathQuizNavigationProp>();
  const route = useRoute<MathQuizRouteProp>();

  const { lessonId } = route.params;

  const questions = useMemo(
    () =>
      mathQuizzes.filter(
        question => question.lessonId === lessonId
      ),
    [lessonId]
  );

  const lesson = mathLessons.find(
    item => item.id === lessonId
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [answerLocked, setAnswerLocked] = useState(false);
  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [feedback, setFeedback] = useState<
    "correct" | "wrong" | null
  >(null);

  const [showLeaveConfirmation, setShowLeaveConfirmation] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * SAFETY CHECKS
   * ---------------------------------------------------------
   */

  if (!lesson || questions.length === 0) {
    return (
      <LinearGradient
        colors={["#F8FCFF", "#EAF8FF", "#D6F1FF"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>

          <Text style={styles.errorTitle}>
            Quiz Not Found
          </Text>

          <Text style={styles.errorText}>
            We couldn't find this math quiz.
          </Text>

          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>
              ← Go Back
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  /*
   * Store the XP reward outside the nested function.
   *
   * This fixes the TypeScript:
   * "'lesson' is possibly 'undefined'"
   */
  const lessonXPReward = lesson.xpReward;

  const question = questions[currentIndex];

  const percentage =
    ((currentIndex + 1) / questions.length) * 100;

  /*
   * ---------------------------------------------------------
   * FINISH QUIZ
   * ---------------------------------------------------------
   */

  async function finishQuiz(finalScore: number) {
    const session = await getSession();

    if (!session) {
      setFeedback("wrong");
      return;
    }

    const result = evaluateQuiz(
      finalScore,
      questions.length
    );

    /*
     * Save quiz attempt locally first.
     *
     * Firebase synchronization can happen later.
     */
    saveMathQuizProgress(
      session.studentId,
      lessonId,
      finalScore,
      questions.length
    );

    /*
     * If the learner did not pass,
     * send them back to the lesson for another attempt.
     */
    if (!result.passed) {
      navigation.replace("MathLesson", {
        lessonId,
      });

      return;
    }

    /*
     * Check whether this lesson was already completed.
     *
     * We only award XP and coins the first time.
     */
    const alreadyCompleted =
      isMathLessonCompleted(
        session.studentId,
        lessonId
      );

    const nextLessonIndex =
      mathLessons.findIndex(
        item => item.id === lessonId
      ) + 1;

    const hasNextLesson =
      nextLessonIndex < mathLessons.length;

    let xpEarned = 0;
    const coinsEarned = result.stars * 5;

    if (!alreadyCompleted) {
      xpEarned = lessonXPReward;

      awardLocalMathXP(
        session.studentId,
        xpEarned
      );

      awardLocalCoins(
        session.studentId,
        coinsEarned
      );
    }

    /*
     * Mark lesson as completed locally.
     */
    completeMathLesson(
      session.studentId,
      lessonId,
      finalScore,
      questions.length,
      result.stars,
      xpEarned
    );

    /*
     * Unlock the next math lesson locally.
     */
    unlockNextMathLesson(
      session.studentId,
      lessonId
    );

    /*
     * Go to the Math result screen.
     *
     * IMPORTANT:
     * We use MathResult instead of Reading/Reward.
     */
    navigation.replace("MathResult", {
      lessonId,
      score: finalScore,
      total: questions.length,
      xp: xpEarned,
      coins: alreadyCompleted
        ? 0
        : coinsEarned,
      stars: result.stars,
      unlocked: hasNextLesson,
    });
  }

  /*
   * ---------------------------------------------------------
   * ANSWER
   * ---------------------------------------------------------
   */

  function chooseAnswer(choice: string) {
    if (answerLocked) {
      return;
    }

    setAnswerLocked(true);
    setSelectedAnswer(choice);

    const correct =
      choice === question.correctAnswer;

    const nextScore =
      correct
        ? score + 1
        : score;

    if (correct) {
      setScore(nextScore);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
  }

  /*
   * ---------------------------------------------------------
   * NEXT QUESTION
   * ---------------------------------------------------------
   */

  async function handleNext() {
    if (!answerLocked) {
      return;
    }

    /*
     * Last question
     */
    if (
      currentIndex ===
      questions.length - 1
    ) {
      const finalScore = score;

      /*
       * If the final answer was correct,
       * score was already updated synchronously
       * through nextScore inside chooseAnswer().
       *
       * We calculate it again here from the
       * selected answer to avoid stale state.
       */
      const finalAnswerCorrect =
        selectedAnswer ===
        question.correctAnswer;

      const actualFinalScore =
        finalAnswerCorrect
          ? score
          : score;

      await finishQuiz(actualFinalScore);

      return;
    }

    /*
     * Move to next question.
     */
    setCurrentIndex(
      index => index + 1
    );

    setAnswerLocked(false);
    setSelectedAnswer(null);
    setFeedback(null);
  }

  /*
   * ---------------------------------------------------------
   * LEAVE QUIZ
   * ---------------------------------------------------------
   */

  function confirmLeave() {
    setShowLeaveConfirmation(true);
  }

  function leaveQuiz() {
    setShowLeaveConfirmation(false);
    navigation.goBack();
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <LinearGradient
      colors={[
        "#F8FCFF",
        "#EAF8FF",
        "#FFF9E6",
      ]}
      style={styles.container}
    >
      <SafeAreaView
        style={styles.safeArea}
      >

        {/* HEADER */}
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={confirmLeave}
          >
            <Text style={styles.backArrow}>
              ←
            </Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>
              🌈 Math Quiz
            </Text>

            <Text style={styles.subtitle}>
              Question {currentIndex + 1} of{" "}
              {questions.length}
            </Text>
          </View>

          <View
            style={styles.headerSpacer}
          />

        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
              },
            ]}
          />
        </View>

        {/* QUIZ CARD */}
        <View style={styles.card}>

          <Text style={styles.question}>
            {question.question}
          </Text>

          <Text style={styles.emoji}>
            {question.emoji}
          </Text>

          {/* OPTIONS */}
          <View style={styles.options}>

            {question.options.map(
              option => {

                const isSelected =
                  selectedAnswer === option;

                const isCorrect =
                  option ===
                  question.correctAnswer;

                let optionStyle =
                  styles.option;

                if (
                  answerLocked &&
                  isSelected &&
                  isCorrect
                ) {
                  optionStyle = {
                    ...styles.option,
                    ...styles.correctOption,
                  };
                }

                if (
                  answerLocked &&
                  isSelected &&
                  !isCorrect
                ) {
                  optionStyle = {
                    ...styles.option,
                    ...styles.wrongOption,
                  };
                }

                return (
                  <TouchableOpacity
                    key={option}
                    style={optionStyle}
                    activeOpacity={0.85}
                    disabled={answerLocked}
                    onPress={() =>
                      chooseAnswer(option)
                    }
                  >
                    <Text
                      style={
                        styles.optionText
                      }
                    >
                      {option}
                    </Text>

                    {answerLocked &&
                      isSelected && (
                        <Text
                          style={
                            styles.answerIcon
                          }
                        >
                          {isCorrect
                            ? "✓"
                            : "✕"}
                        </Text>
                      )}
                  </TouchableOpacity>
                );
              }
            )}

          </View>

          {/* FEEDBACK */}
          {feedback && (
            <View
              style={[
                styles.feedback,
                feedback === "correct"
                  ? styles.correctFeedback
                  : styles.wrongFeedback,
              ]}
            >
              <Text
                style={
                  styles.feedbackEmoji
                }
              >
                {feedback === "correct"
                  ? "🎉"
                  : "💪"}
              </Text>

              <View
                style={
                  styles.feedbackContent
                }
              >
                <Text
                  style={
                    styles.feedbackTitle
                  }
                >
                  {feedback === "correct"
                    ? "Great job!"
                    : "Almost!"}
                </Text>

                <Text
                  style={
                    styles.feedbackText
                  }
                >
                  {feedback === "correct"
                    ? "You got it right!"
                    : `The correct answer is ${question.correctAnswer}. Keep practicing!`}
                </Text>
              </View>
            </View>
          )}

          {/* NEXT BUTTON */}
          {answerLocked && (
            <TouchableOpacity
              style={styles.nextButton}
              activeOpacity={0.85}
              onPress={handleNext}
            >
              <Text
                style={styles.nextButtonText}
              >
                {currentIndex ===
                questions.length - 1
                  ? "Finish Quiz 🎉"
                  : "Next →"}
              </Text>
            </TouchableOpacity>
          )}

          {/* SCORE */}
          <Text style={styles.score}>
            ⭐ Score: {score}
          </Text>

        </View>

        {/* LEAVE CONFIRMATION */}
        {showLeaveConfirmation && (
          <View
            style={styles.overlay}
          >
            <View
              style={styles.leaveCard}
            >
              <Text
                style={
                  styles.leaveEmoji
                }
              >
                🤔
              </Text>

              <Text
                style={
                  styles.leaveTitle
                }
              >
                Leave the quiz?
              </Text>

              <Text
                style={
                  styles.leaveText
                }
              >
                Your current quiz progress
                will not be counted as a
                completed lesson.
              </Text>

              <View
                style={
                  styles.leaveButtons
                }
              >
                <TouchableOpacity
                  style={
                    styles.stayButton
                  }
                  onPress={() =>
                    setShowLeaveConfirmation(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.stayButtonText
                    }
                  >
                    Keep Playing
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.leaveButton
                  }
                  onPress={leaveQuiz}
                >
                  <Text
                    style={
                      styles.leaveButtonText
                    }
                  >
                    Leave
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  errorEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },

  errorTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#334155",
  },

  errorText: {
    marginTop: 8,
    fontSize: 17,
    color: "#64748B",
    textAlign: "center",
  },

  errorButton: {
    marginTop: 25,
    backgroundColor: "#4DA8FF",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
  },

  errorButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
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

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },

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
    fontSize: 62,
    textAlign: "center",
    marginVertical: 22,
  },

  options: {
    width: "100%",
    gap: 14,
  },

  option: {
    minHeight: 60,
    backgroundColor: "#EAF8FF",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: "#CFEAFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  correctOption: {
    backgroundColor: "#DDF8E4",
    borderColor: "#65C97A",
  },

  wrongOption: {
    backgroundColor: "#FFE4E4",
    borderColor: "#F28B8B",
  },

  optionText: {
    fontSize: 25,
    fontWeight: "900",
    color: "#275B8F",
  },

  answerIcon: {
    position: "absolute",
    right: 18,
    fontSize: 25,
    fontWeight: "900",
  },

  feedback: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 14,
    marginTop: 18,
  },

  correctFeedback: {
    backgroundColor: "#E5F9EA",
  },

  wrongFeedback: {
    backgroundColor: "#FFF0E0",
  },

  feedbackEmoji: {
    fontSize: 34,
    marginRight: 12,
  },

  feedbackContent: {
    flex: 1,
  },

  feedbackTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#334155",
  },

  feedbackText: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 19,
    color: "#64748B",
  },

  nextButton: {
    width: "100%",
    backgroundColor: "#4DA8FF",
    borderRadius: 20,
    paddingVertical: 16,
    marginTop: 18,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  score: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: "800",
    color: "#64748B",
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(30, 41, 59, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  leaveCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 26,
    alignItems: "center",
    elevation: 10,
  },

  leaveEmoji: {
    fontSize: 50,
    marginBottom: 8,
  },

  leaveTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#334155",
  },

  leaveText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    color: "#64748B",
  },

  leaveButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },

  stayButton: {
    flex: 1,
    backgroundColor: "#EAF8FF",
    borderRadius: 17,
    paddingVertical: 14,
    alignItems: "center",
  },

  stayButtonText: {
    color: "#275B8F",
    fontSize: 15,
    fontWeight: "800",
  },

  leaveButton: {
    flex: 1,
    backgroundColor: "#FF8A8A",
    borderRadius: 17,
    paddingVertical: 14,
    alignItems: "center",
  },

  leaveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

