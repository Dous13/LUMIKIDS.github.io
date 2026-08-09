import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { readingLessons } from "../../data/readingLessons";
import { RootStackParamList } from "../../types/navigation";
import { RouteProp } from "@react-navigation/native";

type LessonRouteProp = RouteProp<RootStackParamList, "Lesson">;

export default function LessonScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<LessonRouteProp>();
  const lesson = readingLessons.find(item => item.id === route.params.lessonId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState("");

  if (!lesson) return <SafeAreaView style={styles.center}><Text style={styles.error}>Lesson not found.</Text></SafeAreaView>;

  const current = lesson.levels[currentIndex];

  function nextStep() {
    setMessage("");
    if (currentIndex < lesson.levels.length - 1) setCurrentIndex(value => value + 1);
    else navigation.navigate("Quiz", { lessonId: lesson.id });
  }

  return (
    <LinearGradient colors={["#F8FCFF", "#EAFBFF", "#FFF9E6"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.progress}>Step {currentIndex + 1} of {lesson.levels.length}</Text>
          <View style={styles.card}>
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 }, content: { flexGrow: 1, padding: 20, paddingBottom: 35 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, error: { color: "#64748B", fontSize: 20, fontWeight: "800" }, backButton: { alignSelf: "flex-start", paddingVertical: 8 }, backText: { fontSize: 18, fontWeight: "800", color: "#2563EB" }, progress: { textAlign: "center", color: "#64748B", fontWeight: "800", marginTop: 4 }, card: { marginTop: 12, backgroundColor: "#FFF", borderRadius: 30, padding: 24, alignItems: "center", elevation: 5 }, title: { fontSize: 30, fontWeight: "900", color: "#1E3A8A" }, emoji: { fontSize: 72, marginTop: 12 }, letter: { fontSize: 105, color: "#4DA8FF", fontWeight: "900" }, question: { marginTop: 18, fontSize: 24, textAlign: "center", fontWeight: "800", color: "#334155" }, bigAnswer: { marginTop: 16, fontSize: 45, fontWeight: "900", color: "#4DA8FF", textAlign: "center" }, blueButton: { width: "100%", marginTop: 24, backgroundColor: "#4DA8FF", paddingVertical: 16, borderRadius: 19, alignItems: "center" }, greenButton: { width: "100%", marginTop: 24, backgroundColor: "#57C36A", paddingVertical: 16, borderRadius: 19, alignItems: "center" }, buttonText: { color: "#FFF", fontWeight: "900", fontSize: 19 }, soundButton: { width: "100%", marginTop: 18, backgroundColor: "#EAF8FF", borderWidth: 2, borderColor: "#CFEAFF", borderRadius: 20, padding: 17, alignItems: "center" }, soundText: { color: "#275B8F", fontSize: 20, fontWeight: "900" }, answerButton: { width: "100%", backgroundColor: "#EAF8FF", borderRadius: 18, paddingVertical: 16, marginTop: 12, alignItems: "center", borderWidth: 2, borderColor: "#CFEAFF" }, answerText: { fontSize: 22, fontWeight: "900", color: "#275B8F" }, feedback: { marginTop: 14, color: "#B45309", fontWeight: "800", textAlign: "center" },
});
