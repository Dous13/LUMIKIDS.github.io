import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../../services/firebase/firebase";

export default function TeacherStudentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const snap = await getDoc(doc(db, "students", route.params.studentId));
    setStudent(snap.exists() ? snap.data() : null);
    setLoading(false);
  }, [route.params.studentId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></SafeAreaView>;
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
    <LinearGradient colors={["#62B8FF", "#BFE8FF", "#FFF3C4"]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>← Class</Text></TouchableOpacity>
          <View style={styles.hero}><Text style={styles.avatar}>🧸</Text><Text style={styles.name}>{student.preferredName || student.name}</Text><Text style={styles.fullName}>{student.fullName || student.name}</Text><Text style={styles.classCode}>Class {student.classCode}</Text></View>

          <View style={styles.statGrid}>
            <View style={styles.statCard}><Text style={styles.statEmoji}>⚡</Text><Text style={styles.statValue}>{student.xp || 0}</Text><Text style={styles.statLabel}>Total XP</Text></View>
            <View style={styles.statCard}><Text style={styles.statEmoji}>⭐</Text><Text style={styles.statValue}>{student.level || 1}</Text><Text style={styles.statLabel}>Level</Text></View>
            <View style={styles.statCard}><Text style={styles.statEmoji}>📚</Text><Text style={styles.statValue}>{completed}</Text><Text style={styles.statLabel}>Lessons</Text></View>
            <View style={styles.statCard}><Text style={styles.statEmoji}>💪</Text><Text style={styles.statValue}>{mistakeCount}</Text><Text style={styles.statLabel}>Mistakes</Text></View>
          </View>

          <Text style={styles.sectionTitle}>Subject Progress</Text>
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
  return <View style={styles.progressCard}><View style={styles.progressHeader}><Text style={styles.progressTitle}>{emoji} {title}</Text><Text style={styles.progressValue}>{value} XP</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${Math.min(value / 100, 1) * 100}%` }]} /></View></View>;
}

const styles = StyleSheet.create({
  container:{flex:1},safe:{flex:1},loading:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#F8FCFF"},content:{padding:20,paddingBottom:40},back:{alignSelf:"flex-start",backgroundColor:"rgba(255,255,255,.92)",borderRadius:22,paddingHorizontal:15,paddingVertical:10,elevation:3},backText:{color:"#2563EB",fontWeight:"900",fontSize:16},hero:{marginTop:18,backgroundColor:"rgba(255,255,255,.95)",borderRadius:28,padding:22,alignItems:"center",elevation:6},avatar:{fontSize:64},name:{fontSize:29,fontWeight:"900",color:"#1E3A8A",marginTop:3},fullName:{fontSize:15,color:"#64748B",marginTop:2},classCode:{marginTop:7,color:"#2563EB",fontWeight:"900"},statGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,marginTop:14},statCard:{width:"48%",backgroundColor:"rgba(255,255,255,.95)",borderRadius:20,padding:15,alignItems:"center",elevation:3},statEmoji:{fontSize:25},statValue:{fontSize:22,fontWeight:"900",color:"#334155",marginTop:2},statLabel:{fontSize:12,fontWeight:"800",color:"#64748B"},sectionTitle:{fontSize:22,fontWeight:"900",color:"#FFF",marginTop:24,marginBottom:10,textShadowColor:"rgba(0,0,0,.12)",textShadowRadius:3},progressCard:{backgroundColor:"rgba(255,255,255,.95)",borderRadius:20,padding:15,marginBottom:10,elevation:3},progressHeader:{flexDirection:"row",justifyContent:"space-between"},progressTitle:{fontSize:17,fontWeight:"900",color:"#334155"},progressValue:{fontWeight:"900",color:"#2563EB"},track:{height:11,backgroundColor:"#DCECF8",borderRadius:20,overflow:"hidden",marginTop:9},fill:{height:"100%",backgroundColor:"#58C977",borderRadius:20},mistake:{backgroundColor:"rgba(255,255,255,.95)",borderRadius:18,padding:14,marginBottom:9},mistakeSubject:{fontSize:10,fontWeight:"900",letterSpacing:1,color:"#2563EB"},mistakeQuestion:{marginTop:3,fontSize:15,fontWeight:"800",color:"#334155"},mistakeAnswer:{marginTop:4,fontSize:12,color:"#64748B"},empty:{backgroundColor:"rgba(255,255,255,.95)",borderRadius:20,padding:22,alignItems:"center"},emptyEmoji:{fontSize:35},emptyText:{color:"#64748B",fontWeight:"800",marginTop:5},note:{marginTop:16,backgroundColor:"#FFF8D9",borderRadius:20,padding:15,flexDirection:"row",alignItems:"center"},noteEmoji:{fontSize:26,marginRight:10},noteText:{flex:1,color:"#7C5D00",fontWeight:"700",lineHeight:19},error:{color:"#B91C1C",fontWeight:"800"}
});
