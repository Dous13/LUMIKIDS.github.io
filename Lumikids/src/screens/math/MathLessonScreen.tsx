import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { mathLessons } from "../../data/mathLessons";

export default function MathLessonScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const lessonId = route.params.lessonId;

  const lesson = mathLessons.find(
    (l) => l.id === lessonId
  );

  if (!lesson) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Lesson not found.</Text>
      </SafeAreaView>
    );
  }

  const [page, setPage] = useState(0);

  const current = lesson.pages[page];

  const lastPage =
    page === lesson.pages.length - 1;

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
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.progress}>
        {page + 1} / {lesson.pages.length}
      </Text>

      {/* Spacer to keep the progress centered */}
      <View style={{ width: 48 }} />

    </View>

        <View style={styles.card}>

          <Text style={styles.emoji}>
            {current.emoji}
          </Text>

          <Text style={styles.number}>
            {current.value}
          </Text>

          <Text style={styles.title}>
            {current.title}
          </Text>

          <Text style={styles.description}>
            {current.description}
          </Text>

        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {

            if (!lastPage) {
              setPage(page + 1);
              return;
            }

            navigation.replace(
              "MathQuiz",
              {
                lessonId,
              }
            );

          }}
        >
          <Text style={styles.buttonText}>
            {lastPage
              ? "Start Quiz ⭐"
              : "Next ➜"}
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 24,
  paddingTop: 20,
},

  progress: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
  },

  card: {
    flex: 1,

    margin: 25,

    backgroundColor: "#FFFFFF",

    borderRadius: 30,

    justifyContent: "center",

    alignItems: "center",

    padding: 30,

    elevation: 5,
  },

  emoji: {
    fontSize: 70,
    textAlign: "center",
  },

  number: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#4A90E2",
    marginTop: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 20,
    color: "#334155",
    textAlign: "center",
  },

  description: {
    marginTop: 15,
    fontSize: 20,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 30,
  },

  button: {
    marginHorizontal: 25,
    marginBottom: 30,

    backgroundColor: "#4A90E2",

    borderRadius: 18,

    paddingVertical: 18,

    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
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
  shadowRadius: 8,
  shadowOffset: {
    width: 0,
    height: 4,
  },

  elevation: 5,
},

backArrow: {
  fontSize: 26,
  fontWeight: "bold",
  color: "#4A90E2",
},
});

