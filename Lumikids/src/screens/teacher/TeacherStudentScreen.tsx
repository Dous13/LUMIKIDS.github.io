import { Colors } from "../../theme";
import AnimatedProgress from "../../components/common/AnimatedProgress";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../../services/firebase/firebase";
import { getTeacherSession } from "../../services/teacher/teacherSession";
import { cacheWorksheetReviewAccess } from "../../services/phygital/worksheetStore";

export default function TeacherStudentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const snap = await getDoc(doc(db, "students", route.params.studentId));
    const teacher = await getTeacherSession();
    if (snap.exists() && teacher && snap.data().teacherId === teacher.teacherId) {
      cacheWorksheetReviewAccess(teacher.teacherId, route.params.studentId, snap.data().classCode);
    }
    setStudent(snap.exists() ? snap.data() : null);
    setLoading(false);
  }, [route.params.studentId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  if (!student) return <SafeAreaView style={styles.loading}><Text style={styles.error}>Student not found.</Text></SafeAreaView>;

  const reading = Number(student.readingXP || 0);
  const writing = Number(student.writingXP || 0);
  const math = Number(student.mathXP || 0);
  const totalSubjectXP = reading + writing + math;
  const progress = [student.readingProgress, student.writingProgress, student.mathProgress];
  const completed = progress.reduce((total, item) => total + Object.values(item || {}).filter((p: any) => p.completed).length, 0);
  const mistakes = Object.values(student.mistakes || {}) as any[];
  const mistakeCount = mistakes.reduce((total, item) => total + Number(item.count || 0), 0);

  return (
    <LinearGradient colors={[Colors.teacherBackground, Colors.teacherBackground]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>← Class</Text></TouchableOpacity>
          <FadeIn style={styles.hero}><Text style={styles.avatar}>🧸</Text><Text style={styles.name}>{student.preferredName || student.name}</Text><Text style={styles.fullName}>{student.fullName || student.name}</Text><Text style={styles.classCode}>Class {student.classCode}</Text></FadeIn>

          <View style={styles.statGrid}>
            <View style={styles.statCard}><Text style={styles.statEmoji}>⚡</Text><Text style={styles.statValue}>{student.xp || 0}</Text><Text style={styles.statLabel}>Total XP</Text></View>
            <View style={styles.statCard}><Text style={styles.statEmoji}>⭐</Text><Text style={styles.statValue}>{student.level || 1}</Text><Text style={styles.statLabel}>Level</Text></View>
            <View style={styles.statCard}><Text style={styles.statEmoji}>📚</Text><Text style={styles.statValue}>{completed}</Text><Text style={styles.statLabel}>Lessons</Text></View>
            <View style={styles.statCard}><Text style={styles.statEmoji}>💪</Text><Text style={styles.statValue}>{mistakeCount}</Text><Text style={styles.statLabel}>Mistakes</Text></View>
          </View>

          <Text style={styles.sectionTitle}>Subject Progress</Text>
          <TouchableOpacity style={styles.progressCard} onPress={() => navigation.navigate("WorksheetReview", { studentId: route.params.studentId })}>
            <Text style={styles.progressTitle}>Review Physical Worksheets →</Text>
          </TouchableOpacity>
          <ProgressCard emoji="📖" title="Reading" value={reading} />
          <ProgressCard emoji="✏️" title="Writing" value={writing} />
          <ProgressCard emoji="🔢" title="Math" value={math} />

          <Text style={styles.sectionTitle}>Mistake Summary</Text>
          {mistakes.length === 0 ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🎉</Text><Text style={styles.emptyText}>No recorded mistakes yet.</Text></View> : mistakes.slice(0, 8).map((mistake, index) => <View key={`${mistake.subject}-${mistake.lessonId}-${index}`} style={styles.mistake}><Text style={styles.mistakeSubject}>{String(mistake.subject).toUpperCase()}</Text><Text style={styles.mistakeQuestion}>{mistake.question}</Text><Text style={styles.mistakeAnswer}>Answered: {mistake.selectedAnswer} · Correct: {mistake.correctAnswer} · {mistake.count || 1}×</Text></View>)}

          <View style={styles.note}><Text style={styles.noteEmoji}>💡</Text><Text style={styles.noteText}>This view is for monitoring progress. Teacher-created custom lessons can be added later.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ProgressCard({ emoji, title, value }: { emoji: string; title: string; value: number }) {
  return <View style={styles.progressCard}><View style={styles.progressHeader}><Text style={styles.progressTitle}>{emoji} {title}</Text><Text style={styles.progressValue}>{value} XP</Text></View><AnimatedProgress value={Math.min(value / 100, 1) * 100} color={Colors.primary} style={styles.track} /></View>;
}

const styles = StyleSheet.create({
  container:{flex:1},safe:{flex:1},loading:{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor: Colors.teacherBackground },content:{ padding: 24, paddingBottom: 40, width: "100%", maxWidth: 880, alignSelf: "center", paddingHorizontal: 20 },back:{ alignSelf:"flex-start", backgroundColor: "transparent", borderRadius:22, paddingHorizontal: 0, paddingVertical:10, elevation: 0, minHeight: 44 },backText:{color:Colors.primary,fontWeight:"900",fontSize:16},hero:{ marginTop:18, backgroundColor: "transparent", borderRadius: 0, padding: 0, alignItems: "flex-start", elevation: 0 },avatar:{ fontSize:64, display: "none" },name:{ fontSize: 30, fontWeight: "800", color: Colors.text, marginTop:3, lineHeight: 38 },fullName:{ fontSize: 16, color: Colors.textSecondary, marginTop:2 },classCode:{ marginTop:7, color:Colors.primary, fontWeight: "600" },statGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,marginTop:14},statCard:{ width: "auto", backgroundColor: Colors.white, borderRadius: 14, padding: 18, alignItems: "flex-start", elevation: 1, borderWidth: 1, borderColor: "#C8DDEA", flexBasis: "46%", flexGrow: 1, borderBottomWidth: 2 },statEmoji:{ fontSize: 20, textAlignVertical: "center", includeFontPadding: false },statValue:{ fontSize: 28, fontWeight: "800", color: Colors.text, marginTop:2, lineHeight: 36 },statLabel:{ fontSize: 14, fontWeight: "600", color: Colors.textSecondary, lineHeight: 21 },sectionTitle:{ fontSize: 20, fontWeight: "800", color: Colors.text, marginTop:24, marginBottom:10, textShadowColor:"rgba(0,0,0,.12)", textShadowRadius: 0, lineHeight: 28 },progressCard:{ backgroundColor: Colors.white, borderRadius: 14, padding: 18, marginBottom:10, elevation: 1, borderWidth: 1, borderColor: "#C8DDEA" },progressHeader:{ flexDirection:"row", justifyContent:"space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },progressTitle:{ fontSize: 16, fontWeight: "700", color: Colors.text, lineHeight: 24 },progressValue:{ fontWeight: "700", color: Colors.primary, fontSize: 15, lineHeight: 23 },track:{height:11,backgroundColor:"#DCECF8",borderRadius:20,overflow:"hidden",marginTop:9},fill:{height:"100%",backgroundColor:"#58C977",borderRadius:20},mistake:{ backgroundColor: Colors.white, borderRadius: 14, padding: 18, marginBottom:9, elevation: 1, borderWidth: 1, borderColor: "#E1E7E5" },mistakeSubject:{ fontSize: 11, fontWeight: "700", letterSpacing:1, color:Colors.primary, lineHeight: 17 },mistakeQuestion:{ marginTop:3, fontSize: 16, fontWeight: "700", color: Colors.text, lineHeight: 23 },mistakeAnswer:{ marginTop:4, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },empty:{ backgroundColor: Colors.white, borderRadius: 14, padding:22, alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#E1E7E5" },emptyEmoji:{fontSize:35},emptyText:{ color:Colors.textSecondary, fontWeight: "600", marginTop:5, fontSize: 15, lineHeight: 23 },note:{ marginTop:16, backgroundColor: "#F1F3EB", borderRadius: 12, padding:15, flexDirection:"row", alignItems:"center" },noteEmoji:{fontSize:26,marginRight:10},noteText:{ flex:1, color: "#566345", fontWeight: "500", lineHeight: 22, fontSize: 14 },error:{color:"#B91C1C",fontWeight:"800"}
});
