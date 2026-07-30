import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { readingLessons } from "../../data/readingLessons";

export default function LessonScreen() {
  const navigation = useNavigation<any>();
  const lesson = readingLessons[0];
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentLevel =
    lesson.levels[currentIndex];

  function nextStep() {
    if (currentIndex < lesson.levels.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    navigation.navigate("Quiz", {
        lessonId: lesson.id,
    });
  }

  function playLetterSound() {
    console.log("Letter Sound");
  }

  function playWordSound() {
    console.log("Word Sound");
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
      >
          <Text style={styles.backText}>
              ← Back
          </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        Letter {lesson.letter}
      </Text>

      <Text style={styles.emoji}>
        {lesson.emoji}
      </Text>

      <Text style={styles.letter}>
        {lesson.letter}
      </Text>
      {currentLevel.type === "introduce" && (
        <>
          <Text style={styles.question}>
            This is the letter
          </Text>

          <Text style={styles.bigAnswer}>
            {lesson.letter}
          </Text>

          <TouchableOpacity
            style={styles.blueButton}
            onPress={nextStep}
          >
            <Text style={styles.buttonText}>
              Next →
            </Text>
          </TouchableOpacity>
        </>
      )}
      {currentLevel.type === "listenLetter" && (
        <>
          <Text style={styles.question}>
            Tap to hear the letter!
          </Text>

          <TouchableOpacity
            style={styles.soundButton}
            onPress={playLetterSound}
          >
            <Text style={styles.soundText}>
              🔊 {lesson.letterSound}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blueButton}
            onPress={nextStep}
          >
            <Text style={styles.buttonText}>
              I heard it!
            </Text>
          </TouchableOpacity>
        </>
      )}
      {currentLevel.type === "listenWord" && (
        <>
          <Text style={styles.question}>
            Tap to hear the word!
          </Text>

          <TouchableOpacity
            style={styles.soundButton}
            onPress={playWordSound}
          >
            <Text style={styles.soundText}>
              🔊 {lesson.word}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blueButton}
            onPress={nextStep}
          >
            <Text style={styles.buttonText}>
              Next →
            </Text>
          </TouchableOpacity>
        </>
      )}
      {currentLevel.type === "question" &&
        currentLevel.question && (
          <>
          <Text style={styles.question}>
            {currentLevel.question}
          </Text>

            {currentLevel.choices?.map((choice: string) => (
              <TouchableOpacity
                key={choice}
                style={styles.answerButton}
                onPress={() => {
                  if (choice === currentLevel.answer){
                    Alert.alert(
                      "🎉 Great Job!",
                      "That's correct!"
                    );

                    nextStep();
                  } else {
                    Alert.alert(
                      "Oops!",
                      "Try again!"
                    );
                  }
                }}
              >
                <Text style={styles.answerText}>
                  {choice}
                </Text>
              </TouchableOpacity>
            ))}
          </>
      )}
      {currentLevel.type === "finish" && (
        <>
          <Text style={styles.question}>
            🎉 Great Job!
          </Text>

          <Text style={styles.bigAnswer}>
            You learned
            {"\n"}
            Letter {lesson.letter}
          </Text>

          <TouchableOpacity
            style={styles.greenButton}
            onPress={() =>
              navigation.navigate("Quiz", {
                lessonId: lesson.id,
              })
            }
          >
            <Text style={styles.buttonText}>
              🧠 Start Quiz
            </Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FCFF",
    padding: 24,
    alignItems: "center",
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  backText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563EB",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E3A8A",
  },

  emoji: {
    fontSize: 90,
    marginTop: 20,
  },

  letter: {
    fontSize: 120,
    color: "#4DA8FF",
    fontWeight: "900",
  },

  question: {
    marginTop: 30,
    fontSize: 28,
    textAlign: "center",
    fontWeight: "700",
    color: "#334155",
  },

  bigAnswer: {
    marginTop: 20,
    fontSize: 60,
    fontWeight: "900",
    color: "#4DA8FF",
  },

  summary: {
    marginTop: 25,
    fontSize: 24,
    color: "#475569",
    textAlign: "center",
    lineHeight: 36,
  },

  soundButton: {
    marginTop: 30,
    backgroundColor: "#FFD54F",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 35,
  },

  soundText: {
    fontSize: 28,
    fontWeight: "800",
  },

  answerButton: {
    width: "100%",
    marginTop: 16,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 22,
    elevation: 3,
  },

  answerText: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
  },

  blueButton: {
    marginTop: 40,
    backgroundColor: "#4DA8FF",
    borderRadius: 25,
    paddingHorizontal: 50,
    paddingVertical: 18,
  },

  greenButton: {
    marginTop: 40,
    backgroundColor: "#57C36A",
    borderRadius: 25,
    paddingHorizontal: 50,
    paddingVertical: 18,
  },

  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 24,
  },
});