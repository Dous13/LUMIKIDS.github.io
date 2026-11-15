import { Colors } from "../../theme";
import TouchableOpacity from "../../components/common/MotionTouchable";

import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type ActivityChoiceRoute = RouteProp<
  RootStackParamList,
  "LessonActivityChoice"
>;

export default function LessonActivityChoiceScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ActivityChoiceRoute>();

  const { subject, lessonId } = route.params;

  const subjectName =
    subject === "math"
      ? "Math"
      : subject === "reading"
        ? "Reading"
        : "Writing";

  function startDigitalActivity() {
    if (subject === "reading") {
      navigation.navigate("Quiz", { lessonId: String(lessonId) });
    } else if (subject === "writing") {
      navigation.navigate("TraceLetter", { lessonId: String(lessonId) });
    } else {
      navigation.navigate("MathQuiz", { lessonId: Number(lessonId) });
    }
  }

  function openWorksheet() {
    navigation.navigate("WorksheetPreview", {
      subject,
      lessonId,
    });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.emoji}>🌟</Text>
      <Text style={styles.title}>How would you like to learn?</Text>
      <Text style={styles.subtitle}>
        {subjectName} · Lesson {lessonId}
      </Text>

      <TouchableOpacity
        style={styles.digitalCard}
        onPress={startDigitalActivity}
        activeOpacity={0.85}
      >
        <Text style={styles.cardEmoji}>📱</Text>
        <Text style={styles.cardTitle}>Digital Activity</Text>
        <Text style={styles.cardDescription}>
          Complete your activity directly in LUMIKIDS.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.physicalCard}
        onPress={openWorksheet}
        activeOpacity={0.85}
      >
        <Text style={styles.cardEmoji}>📝</Text>
        <Text style={styles.cardTitle}>Physical Worksheet</Text>
        <Text style={styles.cardDescription}>
          Print your worksheet, answer it on paper, and scan it.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: "center" },
  emoji: {
    fontSize: 54,
    textAlign: "center",
    marginBottom: 12,
  },
  title: { fontSize: 25, fontWeight: "800", color: Colors.text, textAlign: "center", lineHeight: 33, maxWidth: 620, alignSelf: "center" },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  digitalCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 22, marginBottom: 16, elevation: 1, borderWidth: 1, borderColor: "#BDD4E8", width: "100%", maxWidth: 620, alignSelf: "center", borderBottomWidth: 3 },
  physicalCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 22, elevation: 1, borderWidth: 1, borderColor: "#D4DECC", width: "100%", maxWidth: 620, alignSelf: "center", borderBottomWidth: 3 },
  cardEmoji: { fontSize: 35, marginBottom: 8, textAlignVertical: "center", includeFontPadding: false },
  cardTitle: { fontSize: 19, fontWeight: "800", color: "#1E3A8A", lineHeight: 27 },
  cardDescription: { fontSize: 16, color: "#475569", marginTop: 6, lineHeight: 24 },
  backButton: { alignSelf: "center", padding: 16, marginTop: 14, minHeight: 48 },
  backText: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
