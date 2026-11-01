
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

type Subject = "reading" | "writing" | "math";

type ChoiceRoute = RouteProp<RootStackParamList, "LessonActivityChoice">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const subjectDetails = {
  reading: {
    title: "Reading",
    emoji: "📚",
    description: "Practice letters, sounds, and words.",
    color: "#4DA8FF",
  },
  writing: {
    title: "Writing",
    emoji: "✏️",
    description: "Practice tracing letters and writing words.",
    color: "#F2A65A",
  },
  math: {
    title: "Math",
    emoji: "🔢",
    description: "Practice numbers and problem-solving.",
    color: "#57C36A",
  },
};

export default function LessonActivityChoiceScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ChoiceRoute>();

  const { subject, lessonId } = route.params;
  const details = subjectDetails[subject];

  function startDigitalActivity() {
    if (subject === "reading") {
      navigation.navigate("Quiz", { lessonId: String(lessonId) });
    } else if (subject === "writing") {
      navigation.navigate("TraceLetter", { lessonId: String(lessonId) });
    } else {
      navigation.navigate("MathQuiz", { lessonId: Number(lessonId) });
    }
  }

  function openPrintableWorksheet() {
    navigation.navigate("WorksheetPreview", {
      subject,
      lessonId,
    });
  }

  return (
    <LinearGradient
      colors={["#F8FCFF", "#EAF8FF", "#D6F1FF"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#246BCE" />
            <Text style={styles.backText}>Back to Lesson</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>{details.emoji}</Text>
            <Text style={styles.title}>{details.title} Activity</Text>
            <Text style={styles.description}>
              Choose how you want to complete this lesson.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.digitalCard}
            onPress={startDigitalActivity}
            activeOpacity={0.85}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={30} color="#246BCE" />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Complete Digitally</Text>
              <Text style={styles.cardDescription}>
                Complete the activity directly in LUMIKIDS.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#246BCE" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.printCard}
            onPress={openPrintableWorksheet}
            activeOpacity={0.85}
          >
            <View style={styles.printIconCircle}>
              <Ionicons name="print-outline" size={30} color="#FFFFFF" />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.printTitle}>Use Printable Worksheet</Text>
              <Text style={styles.printDescription}>
                Print the lesson and complete it using paper and pencil.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 15,
    left: 22,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#246BCE",
    fontWeight: "800",
    fontSize: 15,
  },
  header: {
    alignItems: "center",
    marginBottom: 35,
  },
  emoji: { fontSize: 65, marginBottom: 12 },
  title: {
    fontSize: 29,
    fontWeight: "900",
    color: "#244A86",
    textAlign: "center",
  },
  description: {
    color: "#52657D",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  digitalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#DCE8F8",
  },
  printCard: {
    backgroundColor: "#246BCE",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#E2EEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  printIconCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: { flex: 1, marginHorizontal: 13 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#244A86",
  },
  cardDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
    lineHeight: 19,
  },
  printTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  printDescription: {
    fontSize: 13,
    color: "#EAF3FF",
    marginTop: 5,
    lineHeight: 19,
  },
});
