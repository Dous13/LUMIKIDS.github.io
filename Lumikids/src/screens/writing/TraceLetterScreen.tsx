import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import ExitLessonModal from "../../components/common/ExitLessonModal";
import { useExitLessonGuard } from "../../hooks/useExitLessonGuard";
import { Ionicons } from "@expo/vector-icons";
import { writingLessons } from "../../data/writingLessons";
import LetterGuide from "../../components/writing/LetterGuide";
import TracingCanvas from "../../components/writing/TracingCanvas";
import { getSession } from "../../services/session/session";
import { awardLocalCoins, awardLocalWritingXP } from "../../services/database/localStudent";
import { completeWritingLesson, isWritingLessonCompleted, unlockNextWritingLesson } from "../../services/database/localWriting";

type Phase = "uppercase" | "lowercase" | "word";

export default function TraceLetterScreen() {
  const navigation = useNavigation<any>();
  const exitGuard = useExitLessonGuard(() => navigation.goBack());
  const route = useRoute<any>();
  const lesson = writingLessons.find(item => item.id === route.params.lessonId);
  const [phase, setPhase] = useState<Phase>("uppercase");
  const [resetKey, setResetKey] = useState(0);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const onDrawingChange = useCallback((value: boolean) => setHasDrawing(value), []);

  if (!lesson) return <SafeAreaView style={styles.center}><Text style={styles.error}>Lesson not found.</Text></SafeAreaView>;

  const target = phase === "uppercase" ? lesson.letter : phase === "lowercase" ? lesson.letter.toLowerCase() : lesson.word;
  const phaseNumber = phase === "uppercase" ? 1 : phase === "lowercase" ? 2 : 3;

  function clearDrawing() {
    setResetKey(value => value + 1);
    setHasDrawing(false);
    setMessage("");
  }

  async function next() {
    if (!hasDrawing) {
      setMessage("Trace the guide first, then tap Next. ✏️");
      return;
    }

    if (phase === "uppercase") {
      setPhase("lowercase");
      clearDrawing();
      return;
    }
    if (phase === "lowercase") {
      setPhase("word");
      clearDrawing();
      return;
    }

    setSaving(true);
    const session = await getSession();
    if (!session) {
      setMessage("Your student session could not be found. Please return home and try again.");
      setSaving(false);
      return;
    }

    const alreadyCompleted = isWritingLessonCompleted(session.studentId, lesson.id);
    if (!alreadyCompleted) {
      awardLocalWritingXP(session.studentId, lesson.xp);
      awardLocalCoins(session.studentId, lesson.coins);
    }
    completeWritingLesson(session.studentId, lesson.id, 3);
    unlockNextWritingLesson(session.studentId, lesson.id);

    navigation.replace("Reward", {
      subject: "writing",
      lessonId: lesson.id,
      xp: alreadyCompleted ? 0 : lesson.xp,
      coins: alreadyCompleted ? 0 : lesson.coins,
      stars: 3,
      unlocked: writingLessons.findIndex(item => item.id === lesson.id) < writingLessons.length - 1,
      levelUp: false,
    });
  }

  return (
    <LinearGradient colors={["#CFEFFF", "#EAFBFF", "#FFF9E8"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backButton} onPress={exitGuard.requestExit} disabled={saving}>
              <Ionicons name="arrow-back" size={25} color="#2563EB" /><Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.phase}>Step {phaseNumber} of 3</Text>
          </View>

          <Text style={styles.title}>✏️ Trace & Write</Text>
          <Text style={styles.subtitle}>Click and drag along the light guide to trace.</Text>

          <View style={styles.canvasCard}>
            <LetterGuide target={target} />
            <TracingCanvas resetKey={resetKey} onDrawingChange={onDrawingChange} />
          </View>

          {message ? <View style={styles.messageCard}><Text style={styles.message}>{message}</Text></View> : null}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.clearButton} onPress={clearDrawing} disabled={saving}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextButton, !hasDrawing && styles.nextDisabled]} onPress={next} disabled={saving}>
              <Text style={styles.nextText}>{saving ? "Saving..." : phase === "word" ? "Finish 🎉" : "Next →"}</Text>
            </TouchableOpacity>
          </View>
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
  container: { flex: 1 }, safeArea: { flex: 1 }, content: { padding: 20, paddingBottom: 35 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, backButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, elevation: 3 }, backText: { marginLeft: 6, fontSize: 17, fontWeight: "800", color: "#2563EB" }, phase: { color: "#64748B", fontWeight: "800" },
  title: { marginTop: 18, fontSize: 30, fontWeight: "900", textAlign: "center", color: "#1E3A8A" }, subtitle: { marginTop: 6, textAlign: "center", color: "#64748B", fontSize: 16 },
  canvasCard: { minHeight: 320, height: 390, marginTop: 18, backgroundColor: "#FFF", borderRadius: 30, overflow: "hidden", elevation: 6, position: "relative" },
  messageCard: { marginTop: 12, backgroundColor: "#FFF8E1", borderRadius: 16, padding: 12 }, message: { textAlign: "center", color: "#7C5D00", fontWeight: "800" },
  buttons: { flexDirection: "row", gap: 12, marginTop: 14 }, clearButton: { flex: 1, backgroundColor: "#FFE4E4", borderRadius: 18, paddingVertical: 16, alignItems: "center" }, clearText: { color: "#B91C1C", fontWeight: "900", fontSize: 17 }, nextButton: { flex: 1.5, backgroundColor: "#4DA8FF", borderRadius: 18, paddingVertical: 16, alignItems: "center" }, nextDisabled: { opacity: 0.5 }, nextText: { color: "#FFF", fontWeight: "900", fontSize: 18 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, error: { fontSize: 20, fontWeight: "800", color: "#64748B" },
});
