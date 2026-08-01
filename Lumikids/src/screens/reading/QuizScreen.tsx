import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
} from "../../services/database/localProgress";

type QuizRouteProp = RouteProp<
  RootStackParamList,
  "Quiz"
>;

export default function QuizScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<QuizRouteProp>();

  const lessonId = route.params.lessonId;

  const lesson = readingLessons.find(
    l => l.id === lessonId
  )!;

  const quiz =
    readingQuizzes[
      lessonId as keyof typeof readingQuizzes
    ];
  const [currentQuestion, setCurrentQuestion] =
    useState(0);
  const [score, setScore] =
    useState(0);
  const question =
    quiz[currentQuestion];

  function nextQuestion() {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }

    finishQuiz();
  }

  async function finishQuiz() {

    const result = evaluateQuiz(
      score,
      quiz.length
    );

    if (result.passed) {

    const session = await getSession();

    if (!session) {
      Alert.alert("Error", "Student session not found.");
      return;
    }

    const alreadyCompleted =
      isLessonCompleted(
        session.studentId,
        lessonId
      );

    const currentIndex = readingLessons.findIndex(
      lesson => lesson.id === lessonId
    );

    const nextLesson =
      readingLessons[currentIndex + 1];
      if (!alreadyCompleted) {

        awardLocalReadingXP(
          session.studentId,
          lesson.xp
        );

        awardLocalCoins(
          session.studentId,
          lesson.coins
        );

      }

    completeLesson(
      session.studentId,
      lessonId,
      result.stars
    );

    unlockNextLesson(
      session.studentId,
      lessonId
    );

    navigation.replace("Reward", {
      lessonId,
      xp: lesson.xp,
      coins: lesson.coins,
      stars: result.stars,
      unlocked: !!nextLesson,
      levelUp: false,
    });
    
    } else {

      Alert.alert(
        "Let's Practice Again!",
        result.message,
        [
          {
            text: "Retry Lesson",
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );

    }
  }

  function chooseAnswer(choice: string) {
    if (choice === question.answer) {
      setScore(score + 1);

      Alert.alert(
        "⭐ Correct!",
        "Awesome job!",
        [
          {
            text: "Next",
            onPress: nextQuestion,
          },
        ]
      );
    } else {
      Alert.alert(
        "😊 Almost!",
        "Try again!"
      );
    }
  }

  return (
    <LinearGradient
      colors={["#C8F2FF", "#EAFBFF", "#FFF9E6"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#2563EB"
          />

          <Text style={styles.backText}>
            Lesson
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>

          <Text style={styles.progress}>
            Question {currentQuestion + 1} of {quiz.length}
          </Text>

          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>
              ⭐ {score * 10} XP
            </Text>
          </View>

        </View>

        <Text style={styles.title}>
          🌈 Reading Quiz
        </Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  ((currentQuestion + 1) /
                    quiz.length) *
                  100
                }%`,
              },
            ]}
          />
        </View>

        <View style={styles.questionCard}>

          <Text style={styles.question}>
            {question.question}
          </Text>

          {question.image && (
            <Text style={styles.image}>
              {question.image}
            </Text>
          )}

        </View>

        {question.choices.map((choice) => (

          <TouchableOpacity
            key={choice}
            style={styles.choice}
            activeOpacity={0.85}
            onPress={() =>
              chooseAnswer(choice)
            }
          >

            <Text style={styles.choiceText}>
              {choice}
            </Text>

          </TouchableOpacity>

        ))}

        <View style={styles.tipCard}>

          <Text style={styles.tipEmoji}>
            🦉
          </Text>

          <Text style={styles.tipText}>
            I'm rooting for you!
            {"\n"}
            Read carefully before choosing.
          </Text>

        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 24,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progress: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "700",
  },

  xpBadge: {
    backgroundColor: "#FFE66D",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },

  xpText: {
    fontSize: 18,
    fontWeight: "800",
  },

  title: {
    marginTop: 18,
    marginBottom: 20,
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    color: "#2563EB",
  },

  progressBar: {
    height: 16,
    backgroundColor: "#D7ECFF",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 28,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#66D17A",
    borderRadius: 20,
  },

  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 24,
    marginBottom: 28,
    borderWidth: 3,
    borderColor: "#D6F2FF",
    elevation: 6,
    alignItems: "center",
  },

  question: {
    fontSize: 30,
    textAlign: "center",
    fontWeight: "800",
    color: "#1E3A8A",
  },

  image: {
    fontSize: 120,
    marginTop: 25,
  },

  choice: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 22,
    marginBottom: 18,
    borderWidth: 3,
    borderColor: "#BEE8FF",
    elevation: 4,
  },

  choiceText: {
    fontSize: 26,
    textAlign: "center",
    fontWeight: "800",
    color: "#374151",
  },

  tipCard: {
    marginTop: 20,
    backgroundColor: "#FFF5BF",
    borderRadius: 25,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  tipEmoji: {
    fontSize: 46,
  },

  tipText: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "700",
    color: "#7C5A00",
    flex: 1,
  },

});