import { Colors } from "../../theme";
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
    <LinearGradient colors={[Colors.background, Colors.background]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={exitGuard.requestExit}>
            <Ionicons name="arrow-back" size={25} color={Colors.primary} /><Text style={styles.backText}>Writing</Text>
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
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 8, minHeight: 44 }, backText: { marginLeft: 8, fontWeight: "700", fontSize: 18, color: Colors.writing },
  card: { width: "100%", maxWidth: 560, minHeight: 0, alignSelf: "center", marginTop: 14, backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: "center", justifyContent: "center", elevation: 1, borderWidth: 1, borderColor: Colors.writingBorder, paddingVertical: 24, borderBottomWidth: 3 }, step: { fontSize: 15, color: Colors.writing, fontWeight: "700", lineHeight: 22 }, emoji: { fontSize: 60, marginTop: 14 }, letter: { fontSize: 104, fontWeight: "900", color: Colors.writing, lineHeight: 120 }, word: { fontSize: 30, fontWeight: "800", color: Colors.text, lineHeight: 39, textAlign: "center", flexShrink: 1 }, description: { width: "100%", maxWidth: 470, marginTop: 18, textAlign: "center", fontSize: 18, lineHeight: 27, color: Colors.textSecondary }, button: { width: "100%", marginTop: 24, backgroundColor: Colors.writing, paddingVertical: 17, borderRadius: 16, alignItems: "center", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.writingDark }, buttonText: { color: Colors.white, fontWeight: "800", fontSize: 20, lineHeight: 27, textAlign: "center" }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, error: { fontSize: 20, fontWeight: "800", color: Colors.textSecondary },
});
