import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ExitLessonModal from "../../components/common/ExitLessonModal";
import { useExitLessonGuard } from "../../hooks/useExitLessonGuard";
import { SafeAreaView } from "react-native-safe-area-context";
import { writingLessons } from "../../data/writingLessons";

export default function WritingLessonScreen() {
  const navigation = useNavigation<any>();
  const exitGuard = useExitLessonGuard(() => navigation.goBack());
  const route = useRoute<any>();
  const lesson = writingLessons.find(item => item.id === route.params.lessonId);

  if (!lesson) return <SafeAreaView style={styles.center}><Text style={styles.error}>Lesson not found.</Text></SafeAreaView>;

  return (
    <LinearGradient colors={["#EAF7FF", "#EAF7FF"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={exitGuard.requestExit}>
            <Ionicons name="arrow-back" size={25} color="#176BC1" /><Text style={styles.backText}>Writing</Text>
          </TouchableOpacity>
          <FadeIn style={styles.card}>
            <Text style={styles.step}>Letter practice</Text>
            <Text style={styles.emoji}>{lesson.emoji}</Text>
            <Text style={styles.letter}>{lesson.letter}</Text>
            <Text style={styles.word}>{lesson.word}</Text>
            <Text style={styles.description}>Trace the letter carefully, then practice writing the word.</Text>
            <TouchableOpacity style={styles.button} onPress={() =>
            navigation.navigate("LessonActivityChoice", {
              subject: "writing",
              lessonId: lesson.id,
            })}>
              <Text style={styles.buttonText}>Start Tracing →</Text>
            </TouchableOpacity>
          </FadeIn>
        </ScrollView>
      
        <ExitLessonModal
          visible={exitGuard.visible}
          onStay={exitGuard.stay}
          onLeave={exitGuard.leave}
        />
</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 }, content: { flexGrow: 1, padding: 20, paddingBottom: 40, width: "100%", maxWidth: 720, alignSelf: "center" },
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 8 }, backText: { marginLeft: 8, fontWeight: "700", fontSize: 18, color: "#176BC1" },
  card: { width: "100%", maxWidth: 560, minHeight: 520, alignSelf: "center", marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, alignItems: "center", justifyContent: "center", elevation: 1, borderWidth: 1, borderColor: "#CAB0EC" }, step: { fontSize: 17, color: "#64748B", fontWeight: "800" }, emoji: { fontSize: 72, marginTop: 18 }, letter: { fontSize: 125, fontWeight: "900", color: "#7840BE", lineHeight: 140 }, word: { fontSize: 34, fontWeight: "800", color: "#23394A" }, description: { width: "100%", maxWidth: 470, marginTop: 25, textAlign: "center", fontSize: 19, lineHeight: 28, color: "#5D7080" }, button: { width: "100%", marginTop: 30, backgroundColor: "#7840BE", paddingVertical: 17, borderRadius: 16, alignItems: "center", minHeight: 52 }, buttonText: { color: "#FFF", fontWeight: "900", fontSize: 20 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, error: { fontSize: 20, fontWeight: "800", color: "#64748B" },
});
