import React, { useState } from "react";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { readingQuizzes } from "../../data/readingQuizzes";
import { RootStackParamList } from "../../types/navigation";

    type QuizRouteProp = RouteProp<
        RootStackParamList,
        "Quiz"
    >;

export default function QuizScreen() {

    const navigation = useNavigation<any>();
    const route = useRoute<QuizRouteProp>();
    const lessonId =
        route.params.lessonId as keyof typeof readingQuizzes;
    const quiz = readingQuizzes[lessonId];
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

    function finishQuiz() {
    Alert.alert(
      "🎉 Great Job!",
      `Score: ${score}/${quiz.length}`,
      [
        {
          text: "Continue",
          onPress: () =>
            navigation.goBack(),
        },
      ]
    );
  }

  function chooseAnswer(choice: string) {
    if (choice === question.answer) {
      setScore(score + 1);

      Alert.alert(
        "⭐ Correct!",
        "Awesome!",
        [
          {
            text: "Next",
            onPress: nextQuestion,
          },
        ]
      );
    } else {
      Alert.alert(
        "Oops!",
        "Try again!"
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.progress}>
        Question {currentQuestion + 1} / {quiz.length}
      </Text>

      <Text style={styles.question}>
        {question.question}
      </Text>

      {question.image && (
        <Text style={styles.image}>
          {question.image}
        </Text>
      )}

      {question.choices.map((choice: string) => (

        <TouchableOpacity
          key={choice}
          style={styles.choice}
          onPress={() => chooseAnswer(choice)}
        >

          <Text style={styles.choiceText}>
            {choice}
          </Text>

        </TouchableOpacity>

      ))}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F8FCFF",
    padding: 24,
    justifyContent: "center",
  },

  progress: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 18,
    marginBottom: 20,
  },

  question: {
    fontSize: 32,
    textAlign: "center",
    fontWeight: "800",
    color: "#1E3A8A",
  },

  image: {
    fontSize: 90,
    textAlign: "center",
    marginVertical: 40,
  },

  choice: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    marginVertical: 10,
    elevation: 3,
  },

  choiceText: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
  },

});