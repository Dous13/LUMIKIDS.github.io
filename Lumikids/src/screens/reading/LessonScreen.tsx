import { Colors } from "../../theme";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import ExitLessonModal from "../../components/common/ExitLessonModal";
import { useExitLessonGuard } from "../../hooks/useExitLessonGuard";
import { readingLessons } from "../../data/readingLessons";
import { RootStackParamList } from "../../types/navigation";
import { RouteProp } from "@react-navigation/native";

type LessonRouteProp = RouteProp<RootStackParamList, "Lesson">;

export default function LessonScreen() {
  const navigation = useNavigation<any>();
  const exitGuard = useExitLessonGuard(() => navigation.goBack());
  const route = useRoute<LessonRouteProp>();
  const lesson = readingLessons.find(item => item.id === route.params.lessonId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState("");

  if (!lesson) return <SafeAreaView style={styles.center}><Text style={styles.error}>Lesson not found.</Text></SafeAreaView>;

  const current = lesson.levels[currentIndex];

  function nextStep() {
    setMessage("");

    if (currentIndex < lesson!.levels.length - 1) {
      setCurrentIndex(value => value + 1);
    } else {
      navigation.navigate("LessonActivityChoice", {
        subject: "reading",
        lessonId: lesson!.id,
      });
    }
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.background]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={exitGuard.requestExit}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.progress}>Step {currentIndex + 1} of {lesson.levels.length}</Text>
          <FadeIn style={styles.card}>
            <Text style={styles.title}>Letter {lesson.letter}</Text>
            <Text style={styles.emoji}>{lesson.emoji}</Text>
            <Text style={styles.letter}>{lesson.letter}</Text>

            {current.type === "introduce" && <><Text style={styles.question}>This is the letter</Text><Text style={styles.bigAnswer}>{lesson.letter}</Text><TouchableOpacity style={styles.blueButton} onPress={nextStep}><Text style={styles.buttonText}>Next →</Text></TouchableOpacity></>}
            {current.type === "listenLetter" && <><Text style={styles.question}>Tap to hear the letter!</Text><TouchableOpacity style={styles.soundButton} onPress={() => setMessage("🔊 Letter sound is ready for your audio asset.")}><Text style={styles.soundText}>🔊 {lesson.letterSound || lesson.letter}</Text></TouchableOpacity><TouchableOpacity style={styles.blueButton} onPress={nextStep}><Text style={styles.buttonText}>I heard it!</Text></TouchableOpacity></>}
            {current.type === "listenWord" && <><Text style={styles.question}>Tap to hear the word!</Text><TouchableOpacity style={styles.soundButton} onPress={() => setMessage("🔊 Word sound is ready for your audio asset.")}><Text style={styles.soundText}>🔊 {lesson.word}</Text></TouchableOpacity><TouchableOpacity style={styles.blueButton} onPress={nextStep}><Text style={styles.buttonText}>Next →</Text></TouchableOpacity></>}
            {current.type === "question" && current.question && <>
              <Text style={styles.question}>{current.question}</Text>
              {current.choices?.map(choice => <TouchableOpacity key={choice} style={styles.answerButton} onPress={() => choice === current.answer ? nextStep() : setMessage("Not quite! Try another answer. 💪")}><Text style={styles.answerText}>{choice}</Text></TouchableOpacity>)}
              {message ? <Text style={styles.feedback}>{message}</Text> : null}
            </>}
            {current.type === "finish" && <><Text style={styles.question}>🎉 Great Job!</Text><Text style={styles.bigAnswer}>You learned{"\n"}Letter {lesson.letter}</Text><TouchableOpacity style={styles.greenButton} onPress={nextStep}><Text style={styles.buttonText}>🧠 Start Quiz</Text></TouchableOpacity></>}
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
  container: { flex: 1 }, safeArea: { flex: 1 }, content: { flexGrow: 1, padding: 20, paddingBottom: 35, width: "100%", maxWidth: 720, alignSelf: "center" }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, error: { color: Colors.textSecondary, fontSize: 20, fontWeight: "800" }, backButton: { alignSelf: "flex-start", paddingVertical: 8, minHeight: 44, justifyContent: "center" }, backText: { fontSize: 18, fontWeight: "800", color: Colors.primary }, progress: { textAlign: "center", color: Colors.reading, fontWeight: "700", marginTop: 4, alignSelf: "center", backgroundColor: Colors.readingSurface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }, card: { width: "100%", maxWidth: 560, alignSelf: "center", marginTop: 12, backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: "center", elevation: 1, borderWidth: 1, borderColor: Colors.readingBorder, borderBottomWidth: 3 }, title: { fontSize: 30, fontWeight: "800", color: Colors.reading, textAlign: "center" }, emoji: { fontSize: 72, marginTop: 12 }, letter: { fontSize: 105, color: Colors.reading, fontWeight: "900" }, question: { width: "100%", maxWidth: 480, marginTop: 18, fontSize: 24, lineHeight: 31, textAlign: "center", fontWeight: "800", color: Colors.text }, bigAnswer: { marginTop: 16, fontSize: 40, lineHeight: 50, fontWeight: "900", color: Colors.reading, textAlign: "center" }, blueButton: { width: "100%", marginTop: 24, backgroundColor: Colors.reading, paddingVertical: 16, borderRadius: 16, alignItems: "center", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.readingDark }, greenButton: { width: "100%", marginTop: 24, backgroundColor: Colors.math, paddingVertical: 16, borderRadius: 16, alignItems: "center", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.mathDark }, buttonText: { color: Colors.white, fontWeight: "800", fontSize: 18, lineHeight: 25, textAlign: "center" }, soundButton: { width: "100%", marginTop: 18, backgroundColor: "#FFE8DB", borderWidth: 1, borderColor: Colors.readingBorder, borderRadius: 16, padding: 17, alignItems: "center" }, soundText: { color: Colors.reading, fontSize: 20, fontWeight: "900", textAlign: "center" }, answerButton: { width: "100%", backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 16, marginTop: 12, alignItems: "center", borderWidth: 2, borderColor: Colors.readingBorder, minHeight: 56, paddingHorizontal: 16 }, answerText: { fontSize: 22, fontWeight: "900", color: Colors.reading, textAlign: "center" }, feedback: { marginTop: 14, color: "#B45309", fontWeight: "800", textAlign: "center", fontSize: 15, lineHeight: 22 },
});
