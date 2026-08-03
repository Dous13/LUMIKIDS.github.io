import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import { SafeAreaView } from "react-native-safe-area-context";

import { writingLessons } from "../../data/writingLessons";

export default function WritingLessonScreen() {

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { lessonId } = route.params;

  const lesson = writingLessons.find(
    l => l.id === lessonId
  );

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Text>Lesson not found.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FFFDF8", "#FFF8EA", "#FFF2D6"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color="#2563EB"
          />

          <Text style={styles.backText}>
            Writing
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>

          <Text style={styles.step}>
            Step 1 of 5
          </Text>

          <Text style={styles.emoji}>
            {lesson.emoji}
          </Text>

          <Text style={styles.letter}>
            {lesson.letter}
          </Text>

          <Text style={styles.word}>
            {lesson.word}
          </Text>

          <Text style={styles.description}>
            Today we're going to learn
            how to write the letter{" "}
            <Text style={{ fontWeight: "900" }}>
              {lesson.letter}
            </Text>.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
                navigation.navigate("TraceLetter", {
                    lessonId,
                })
            }
          >
            <Text style={styles.buttonText}>
              Start Tracing →
            </Text>
          </TouchableOpacity>

        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 18,
    marginTop: 10,
  },

  backText: {
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 18,
    color: "#2563EB",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  step: {
    fontSize: 18,
    color: "#64748B",
    marginBottom: 30,
  },

  emoji: {
    fontSize: 90,
  },

  letter: {
    fontSize: 140,
    fontWeight: "900",
    color: "#111827",
  },

  word: {
    marginTop: 10,
    fontSize: 36,
    fontWeight: "600",
  },

  description: {
    marginTop: 35,
    textAlign: "center",
    fontSize: 22,
    color: "#475569",
    lineHeight: 34,
  },

  button: {
    marginTop: 50,
    backgroundColor: "#4DA8FF",
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 22,
  },

  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 20,
  },

});