import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MathLessonScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Math Lesson
      </Text>

      <Text style={styles.subtitle}>
        We'll build this next.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 18,
    color: "#777",
  },
});