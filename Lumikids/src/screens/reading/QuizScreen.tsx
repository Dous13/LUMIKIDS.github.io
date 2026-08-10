import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import ExitLessonModal from "../../components/common/ExitLessonModal";
import { useExitLessonGuard } from "../../hooks/useExitLessonGuard";
import { Ionicons } from "@expo/vector-icons";
import { readingQuizzes } from "../../data/readingQuizzes";
import { RootStackParamList } from "../../types/navigation";
import { evaluateQuiz } from "../../utils/ruleEngine";
import { getSession } from "../../services/session/session";
import { readingLessons } from "../../data/readingLessons";
import { awardLocalReadingXP, awardLocalCoins } from "../../services/database/localStudent";
import { completeLesson, unlockNextLesson, isLessonCompleted } from "../../services/database/localProgress";
import { recordMistake } from "../../services/database/localMistakes";

type QuizRouteProp = RouteProp<RootStackParamList, "Quiz">;

export default function QuizScreen() {
  const navigation = useNavigation<any>();
  const exitGuard = useExitLessonGuard(() => navigation.goBack());
  const route = useRoute<QuizRouteProp>();
  const lessonId = route.params.lessonId;
  const lesson = readingLessons.find(item => item.id === lessonId);
  const quiz = readingQuizzes[lessonId as keyof typeof readingQuizzes];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [passed, setPassed] = useState(false);

  if (!lesson || !quiz || quiz.length === 0) return <SafeAreaView style={styles.center}><Text style={styles.error}>Quiz not found.</Text></SafeAreaView>;
  const question = quiz[currentQuestion];

  async function finishQuiz(finalScore: number) {
    const result = evaluateQuiz(finalScore, quiz.length);
    if (!result.passed) {
      setMessage(result.message || "Let's review the lesson and try again.");
      setPassed(false);
      return;
    }

    const session = await getSession();
    if (!session) {
      setMessage("We couldn't find your student session. Please return home and try again.");
      return;
    }

    const alreadyCompleted = isLessonCompleted(session.studentId, lessonId);
    const currentIndex = readingLessons.findIndex(item => item.id === lessonId);
    const nextLesson = readingLessons[currentIndex + 1];

    if (!alreadyCompleted) {
      awardLocalReadingXP(session.studentId, lesson.xp);
      awardLocalCoins(session.studentId, lesson.coins);
    }

    completeLesson(session.studentId, lessonId, result.stars, finalScore, quiz.length);
    unlockNextLesson(session.studentId, lessonId);

    navigation.replace("Reward", {
      subject: "reading",
      lessonId,
      xp: alreadyCompleted ? 0 : lesson.xp,
      coins: alreadyCompleted ? 0 : lesson.coins,
      stars: result.stars,
      unlocked: !!nextLesson,
      levelUp: false,
    });
  }

  async function chooseAnswer(choice: string) {
    if (locked) return;
    setSelected(choice);
    setLocked(true);
    const correct = choice === question.answer;
    const nextScore = correct ? score + 1 : score;
    if (!correct) {
      const session = await getSession();
      if (session) {
        recordMistake(
          session.studentId,
          "reading",
          lessonId,
          currentQuestion,
          question.question,
          choice,
          question.answer
        );
      }
      setMessage("😊 Almost! The highlighted answer shows what to look for. Try the next question.");
      return;
    }
    setScore(nextScore);
    setMessage("⭐ Correct! Great job.");
  }

  async function nextQuestion() {
    if (!locked) return;
    const finalScore = score + (selected === question.answer ? 1 : 0);
    if (currentQuestion === quiz.length - 1) {
      await finishQuiz(finalScore);
      return;
    }
    setCurrentQuestion(value => value + 1);
    setSelected(null);
    setLocked(false);
    setMessage("");
  }

  return (
    <LinearGradient colors={["#C8F2FF", "#EAFBFF", "#FFF9E6"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={exitGuard.requestExit}><Ionicons name="arrow-back" size={24} color="#2563EB" /><Text style={styles.backText}>Lesson</Text></TouchableOpacity>
          <Text style={styles.title}>🌈 Reading Quiz</Text>
          <Text style={styles.progress}>Question {currentQuestion + 1} of {quiz.length}</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${((currentQuestion + 1) / quiz.length) * 100}%` }]} /></View>

          {message ? <View style={[styles.feedback, message.startsWith("⭐") ? styles.good : styles.notice]}><Text style={styles.feedbackText}>{message}</Text></View> : null}

          <View style={styles.questionCard}>
            <Text style={styles.question}>{question.question}</Text>
            {question.image ? <Text style={styles.image}>{question.image}</Text> : null}
          </View>

          {question.choices.map(choice => {
            const selectedChoice = selected === choice;
            const correctChoice = choice === question.answer;
            return <TouchableOpacity key={choice} style={[styles.choice, locked && correctChoice && styles.correctChoice, locked && selectedChoice && !correctChoice && styles.wrongChoice]} disabled={locked} onPress={() => chooseAnswer(choice)}><Text style={styles.choiceText}>{choice}</Text>{locked && correctChoice ? <Text style={styles.icon}>✓</Text> : null}</TouchableOpacity>;
          })}

          {locked && <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}><Text style={styles.nextText}>{currentQuestion === quiz.length - 1 ? "Finish Quiz 🎉" : "Next →"}</Text></TouchableOpacity>}
          {passed ? null : null}
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
  container: { flex: 1 }, safeArea: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, error: { fontSize: 20, fontWeight: "800", color: "#64748B" }, backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 8 }, backText: { marginLeft: 7, fontSize: 17, fontWeight: "800", color: "#2563EB" }, title: { marginTop: 8, fontSize: 29, fontWeight: "900", color: "#2563EB", textAlign: "center" }, progress: { marginTop: 5, textAlign: "center", color: "#64748B", fontWeight: "800" }, progressBar: { height: 12, backgroundColor: "#D7EAF8", borderRadius: 20, overflow: "hidden", marginTop: 15, marginBottom: 14 }, progressFill: { height: "100%", backgroundColor: "#62C77A" }, feedback: { borderRadius: 18, padding: 13, marginBottom: 12 }, good: { backgroundColor: "#E7F9EB" }, notice: { backgroundColor: "#FFF1E6" }, feedbackText: { color: "#334155", fontWeight: "800", lineHeight: 20 }, questionCard: { backgroundColor: "#FFF", borderRadius: 26, padding: 22, alignItems: "center", elevation: 4 }, question: { fontSize: 24, lineHeight: 31, fontWeight: "900", color: "#334155", textAlign: "center" }, image: { fontSize: 62, marginTop: 15 }, choice: { minHeight: 58, backgroundColor: "#EAF8FF", borderRadius: 19, borderWidth: 2, borderColor: "#CFEAFF", marginTop: 12, padding: 15, justifyContent: "center", alignItems: "center", flexDirection: "row" }, correctChoice: { backgroundColor: "#DDF8E4", borderColor: "#65C97A" }, wrongChoice: { backgroundColor: "#FFE4E4", borderColor: "#F28B8B" }, choiceText: { fontSize: 22, fontWeight: "900", color: "#275B8F" }, icon: { position: "absolute", right: 16, fontSize: 22, fontWeight: "900" }, nextButton: { backgroundColor: "#4DA8FF", borderRadius: 20, paddingVertical: 16, marginTop: 18, alignItems: "center" }, nextText: { color: "#FFF", fontSize: 19, fontWeight: "900" },
});
