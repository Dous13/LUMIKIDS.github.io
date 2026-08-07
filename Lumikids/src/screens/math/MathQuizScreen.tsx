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
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { mathQuizzes } from "../../data/mathQuizzes";

export default function MathQuizScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const lessonId = route.params.lessonId;

  const questions = useMemo(
    () =>
      mathQuizzes.filter(
        q => q.lessonId === lessonId
      ),
    [lessonId]
  );

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [score, setScore] = useState(0);

  const currentQuestion =
    questions[currentIndex];

  function answer(choice: string) {
    let newScore = score;

    if (
      choice === currentQuestion.correctAnswer
    ) {
      newScore++;
      setScore(newScore);
    }

    const isLast =
      currentIndex === questions.length - 1;

    if (isLast) {
        navigation.replace("Reward", {
        subject: "math",
        lessonId,
        xp: newScore * 10,
        coins: newScore * 5,
        stars: newScore,
        unlocked: true,
        levelUp: false,
        });

      return;
    }

    setCurrentIndex(currentIndex + 1);
  }

  return (
    <LinearGradient
      colors={[
        "#F8FCFF",
        "#EAF8FF",
        "#D6F1FF",
      ]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              Alert.alert(
                "Leave Quiz?",
                "Your progress will be lost.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Leave",
                    onPress: () =>
                      navigation.goBack(),
                  },
                ]
              )
            }
          >
            <Text style={styles.backArrow}>
              ←
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Math Quiz
            </Text>

            <Text style={styles.subtitle}>
              Question {currentIndex + 1} of{" "}
              {questions.length}
            </Text>
          </View>

        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  ((currentIndex + 1) /
                    questions.length) *
                  100
                }%`,
              },
            ]}
          />
        </View>

        <View style={styles.card}>

          <Text style={styles.question}>
            {currentQuestion.question}
          </Text>

          <Text style={styles.emoji}>
            {currentQuestion.emoji}
          </Text>

          <View style={styles.options}>
            
            {currentQuestion.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.optionButton}
                activeOpacity={0.9}
                onPress={() => answer(option)}
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
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 15,
    marginBottom: 15,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  backArrow: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4A90E2",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#334155",
  },

  subtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 15,
  },

  progressBar: {
    height: 12,
    backgroundColor: "#D7EAF8",
    borderRadius: 10,
    marginHorizontal: 24,
    overflow: "hidden",
    marginBottom: 28,
  },

  progressFill: {
    flex: 1,
    backgroundColor: "#67C587",
  },

  card: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 25,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  question: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#334155",
  },

  emoji: {
    fontSize: 72,
    textAlign: "center",
    marginVertical: 30,
  },

  options: {
    gap: 16,
  },

  optionButton: {
    backgroundColor: "#EAF8FF",
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: "center",

    borderWidth: 2,
    borderColor: "#CFEAFF",
  },

  optionText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#275B8F",
  },

  score: {
    textAlign: "center",
    marginTop: 28,
    fontWeight: "700",
    color: "#64748B",
    fontSize: 16,
  },
});

