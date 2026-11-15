import { Ionicons } from "@expo/vector-icons";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { getClassStudents, createTeacherStudent } from "../../services/teacher/teacherService";
import { getTeacherSession } from "../../services/teacher/teacherSession";

export default function TeacherClassScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const classCode = route.params.classCode as string;
  const [session, setSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const s = await getTeacherSession();
    if (!s) {
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      return;
    }
    setSession(s);
    setStudents(await getClassStudents(classCode, s.teacherId));
    setLoading(false);
  }, [classCode, navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addStudent() {
    if (!session || saving) return;
    setMessage("");
    if (!fullName.trim() || !preferredName.trim()) {
      setMessage("Please enter both the student's full name and preferred first name.");
      return;
    }
    try {
      setSaving(true);
      await createTeacherStudent({ teacherId: session.teacherId, classCode, fullName, preferredName });
      setFullName("");
      setPreferredName("");
      setShowAdd(false);
      await load();
    } catch (e: any) {
      setMessage(e?.message || "We could not register this student.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color="#2867AD" /></SafeAreaView>;

  return (
    <LinearGradient colors={["#FAF8F2", "#FAF8F2"]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>← My Classes</Text></TouchableOpacity>

          <FadeIn style={styles.hero}>
            <Text style={styles.heroEmoji}>🏫</Text>
            <Text style={styles.title}>Class {classCode}</Text>
            <Text style={styles.subtitle}>Register learners and monitor how they are doing.</Text>
            <View style={styles.codePill}><Text style={styles.codePillText}>Class code: {classCode}</Text></View>
          </FadeIn>

          <TouchableOpacity style={styles.addButton} onPress={() => { setMessage(""); setShowAdd(true); }}>
            <View style={{ marginRight: 12 }}><Ionicons name="person-add-outline" size={24} color="#FFFFFF" /></View><View style={{flex:1}}><Text style={styles.addTitle}>Register a Student</Text><Text style={styles.addText}>Use the student's full name and preferred first name.</Text></View><Text style={styles.addArrow}>＋</Text>
          </TouchableOpacity>

          <View style={styles.section}><Text style={styles.sectionTitle}>Students</Text><Text style={styles.count}>{students.length}</Text></View>

          {students.length === 0 ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🧸</Text><Text style={styles.emptyTitle}>No students yet</Text><Text style={styles.emptyText}>Register a learner and they can sign in with their preferred first name and this class code.</Text></View> : students.map(student => {
            const reading = Number(student.readingXP || 0);
            const writing = Number(student.writingXP || 0);
            const math = Number(student.mathXP || 0);
            const total = reading + writing + math;
            return (
              <TouchableOpacity key={student.id} style={styles.studentCard} activeOpacity={0.88} onPress={() => navigation.navigate("TeacherStudent", { studentId: student.id, classCode })}>
                <View style={styles.avatar}><Text style={{fontSize:28}}>{student.avatar === "default" ? "🧸" : "🌟"}</Text></View>
                <View style={{flex:1}}><Text style={styles.name}>{student.preferredName || student.name}</Text><Text style={styles.fullName}>{student.fullName || student.name}</Text><Text style={styles.stats}>Level {student.level || 1}  ·  {student.xp || 0} XP  ·  {total} subject XP</Text></View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
          <View style={styles.overlay}><View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>👩‍🏫</Text><Text style={styles.modalTitle}>Register Student</Text><Text style={styles.modalText}>The student will use their preferred first name and class code to log in.</Text>
            <TextInput style={styles.input} placeholder="Student's Full Name" value={fullName} onChangeText={setFullName} />
            <TextInput style={styles.input} placeholder="Preferred First Name" value={preferredName} onChangeText={setPreferredName} />
            {message ? <Text style={styles.error}>{message}</Text> : null}
            <View style={styles.modalButtons}><TouchableOpacity style={styles.cancel} onPress={() => setShowAdd(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.save} onPress={addStudent} disabled={saving}><Text style={styles.saveText}>{saving ? "Saving..." : "Register"}</Text></TouchableOpacity></View>
          </View></View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1},safe:{flex:1},loading:{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor: "#FAF8F2" },content:{ padding: 24, paddingBottom: 40, width: "100%", maxWidth: 880, alignSelf: "center" },back:{ alignSelf:"flex-start", backgroundColor: "transparent", borderRadius:22, paddingHorizontal: 0, paddingVertical:10, elevation: 0, minHeight: 44 },backText:{color:"#2867AD",fontWeight:"900",fontSize:16},hero:{ marginTop:18, backgroundColor: "transparent", borderRadius: 0, padding: 0, alignItems: "flex-start", elevation: 0 },heroEmoji:{ fontSize:52, display: "none" },title:{ fontSize: 30, fontWeight: "800", color: "#23394A", marginTop:5 },subtitle:{ color: "#5D7080", textAlign: "left", lineHeight: 23, marginTop:5, fontSize: 15 },codePill:{ marginTop:12, backgroundColor: "#E9EFF2", borderRadius: 8, paddingHorizontal:15, paddingVertical:8 },codePillText:{ color: "#36566F", fontWeight: "700" },addButton:{ marginTop:14, backgroundColor: "#2867AD", borderRadius: 16, padding: 18, flexDirection:"row", alignItems:"center", elevation: 0, minHeight: 52 },addEmoji:{fontSize:30,marginRight:12},addTitle:{ color:"#FFF", fontSize: 17, fontWeight: "700" },addText:{ color:"#EAF3FF", fontSize: 13, marginTop:2, lineHeight: 20 },addArrow:{fontSize:28,color:"#FFF"},section:{flexDirection:"row",alignItems:"center",marginTop:24,marginBottom:10},sectionTitle:{ fontSize: 20, fontWeight: "800", color: "#23394A", textShadowColor:"rgba(0,0,0,.12)", textShadowRadius: 0 },count:{marginLeft:9,minWidth:28,textAlign:"center",backgroundColor:"#FFF",borderRadius:14,paddingVertical:4,color:"#2867AD",fontWeight:"900"},studentCard:{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom:11, flexDirection:"row", alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#E1E7E5" },avatar:{ width: 46, height: 46, borderRadius: 12, backgroundColor: "#EEF3F5", justifyContent:"center", alignItems:"center", marginRight:13 },name:{ fontSize: 18, fontWeight: "700", color: "#23394A" },fullName:{ fontSize: 14, color: "#5D7080", marginTop:2 },stats:{ fontSize: 12, color: "#5D7080", fontWeight: "500", marginTop:5, lineHeight: 20 },arrow:{fontSize:34,color:"#2867AD"},empty:{ backgroundColor: "#FFFFFF", borderRadius: 16, padding:28, alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#E1E7E5" },emptyEmoji:{fontSize:48},emptyTitle:{fontSize:20,fontWeight:"900",color:"#334155",marginTop:8},emptyText:{textAlign:"center",color:"#64748B",lineHeight:20,marginTop:5},overlay:{flex:1,backgroundColor:"rgba(30,41,59,.45)",justifyContent:"center",padding:20},modalCard:{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, elevation: 1, borderWidth: 1, borderColor: "#E1E7E5", width: "100%", maxWidth: 480, alignSelf: "center" },modalEmoji:{ fontSize:48, textAlign:"center", display: "none" },modalTitle:{ fontSize: 23, fontWeight: "800", color: "#23394A", textAlign: "left", marginTop:4 },modalText:{ color: "#5D7080", textAlign: "left", lineHeight: 23, marginTop:6 },input:{ marginTop:12, borderWidth: 1, borderColor: "#CBD6DA", borderRadius: 12, paddingHorizontal:14, paddingVertical:13, fontSize:16, color:"#334155", backgroundColor: "#FFFFFF", minHeight: 52 },error:{color:"#B91C1C",fontWeight:"700",marginTop:10,lineHeight:19},modalButtons:{flexDirection:"row",gap:10,marginTop:18},cancel:{ flex:1, backgroundColor:"#EEF4FF", borderRadius: 12, paddingVertical:14, alignItems:"center", minHeight: 48 },cancelText:{color:"#275B8F",fontWeight:"900"},save:{ flex:1, backgroundColor: "#2867AD", borderRadius: 16, paddingVertical:14, alignItems:"center", minHeight: 48 },saveText:{color:"#FFF",fontWeight:"900"},
});
