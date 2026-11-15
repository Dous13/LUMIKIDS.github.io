import { Colors } from "../../theme";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import ExitLessonModal from "../../components/common/ExitLessonModal";
import { useExitLessonGuard } from "../../hooks/useExitLessonGuard";
import { useNavigation, useRoute } from "@react-navigation/native";
import { mathLessons } from "../../data/mathLessons";
import { getSession } from "../../services/session/session";
import { getMathProgress } from "../../services/database/localMath";

export default function MathLessonScreen() {
  const navigation = useNavigation<any>();
  const exitGuard = useExitLessonGuard(() => navigation.goBack());
  const route = useRoute<any>();
  const lessonId = route.params.lessonId;
  const lesson = mathLessons.find(l => l.id === lessonId);
  const [page, setPage] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await getSession();
      if (!session || !lesson || !mounted) return;
      const progress = getMathProgress(session.studentId, lessonId);
      setLocked(progress?.unlocked !== 1);
    })();
    return () => { mounted = false; };
  }, [lesson, lessonId]);

  if (!lesson) {
    return <SafeAreaView style={styles.center}><Text style={styles.error}>Lesson not found.</Text></SafeAreaView>;
  }

  if (locked) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.lockEmoji}>🔒</Text>
        <Text style={styles.error}>This lesson is locked.</Text>
        <TouchableOpacity style={styles.button} onPress={exitGuard.requestExit}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
        <ExitLessonModal
          visible={exitGuard.visible}
          title="Leave this screen?"
          message="This lesson is locked, so no progress will be changed."
          onStay={exitGuard.stay}
          onLeave={exitGuard.leave}
        />
      </SafeAreaView>
    );
  }

  const current = lesson.pages[page];
  const lastPage = page === lesson.pages.length - 1;

  return (
    <LinearGradient colors={[Colors.background, Colors.background]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={exitGuard.requestExit}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.progress}>{page + 1} / {lesson.pages.length}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <FadeIn style={styles.card}>
            <Text style={styles.emoji}>{current.emoji}</Text>
            <Text style={styles.number}>{current.value}</Text>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.description}>{current.description}</Text>
          </FadeIn>

          <TouchableOpacity
            style={styles.button}
            onPress={() => lastPage
              ? navigation.navigate("LessonActivityChoice", {
                  subject: "math",
                  lessonId: lessonId,
                })
              : setPage(value => value + 1)}
          >
            <Text style={styles.buttonText}>{lastPage ? "Start Quiz ⭐" : "Next ➜"}</Text>
          </TouchableOpacity>
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 34, width: "100%", maxWidth: 720, alignSelf: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  error: { fontSize: 21, fontWeight: "800", color: Colors.textSecondary, textAlign: "center" },
  lockEmoji: { fontSize: 58, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, justifyContent: "center", alignItems: "center", elevation: 4 },
  backArrow: { fontSize: 26, fontWeight: "800", color: Colors.math },
  progress: { fontSize: 18, fontWeight: "700", color: Colors.math },
  headerSpacer: { width: 48 },
  card: { width: "100%", maxWidth: 560, alignSelf: "center", minHeight: 390, marginTop: 18, backgroundColor: Colors.white, borderRadius: 20, justifyContent: "center", alignItems: "center", padding: 24, elevation: 1, borderWidth: 1, borderColor: Colors.mathBorder, borderBottomWidth: 3 },
  emoji: { fontSize: 64, textAlign: "center" },
  number: { fontSize: 70, fontWeight: "900", color: Colors.math, marginTop: 16 },
  title: { width: "100%", maxWidth: 500, fontSize: 28, lineHeight: 34, fontWeight: "800", marginTop: 16, color: Colors.math, textAlign: "center" },
  description: { width: "100%", maxWidth: 500, marginTop: 12, fontSize: 18, color: Colors.textSecondary, textAlign: "center", lineHeight: 27 },
  button: { marginTop: 18, backgroundColor: Colors.math, borderRadius: 16, paddingVertical: 17, alignItems: "center", width: "100%", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.mathDark },
  buttonText: { color: Colors.white, fontSize: 21, fontWeight: "800", lineHeight: 27, textAlign: "center" },
});
