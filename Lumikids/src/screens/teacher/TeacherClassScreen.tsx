import { Colors } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

  if (loading) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  return (
    <LinearGradient colors={[Colors.teacherBackground, Colors.teacherBackground]} style={styles.container}>
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
            <View style={{ marginRight: 12 }}><Ionicons name="person-add-outline" size={24} color="#FFFFFF" /></View><View style={{flex:1,minWidth:0}}><Text style={styles.addTitle}>Register a Student</Text><Text style={styles.addText}>Use the student's full name and preferred first name.</Text></View><Text style={styles.addArrow}>＋</Text>
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
                <View style={{flex:1,minWidth:0}}><Text style={styles.name}>{student.preferredName || student.name}</Text><Text style={styles.fullName}>{student.fullName || student.name}</Text><Text style={styles.stats}>Level {student.level || 1}  ·  {student.xp || 0} XP  ·  {total} subject XP</Text></View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
          <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>👩‍🏫</Text><Text style={styles.modalTitle}>Register Student</Text><Text style={styles.modalText}>The student will use their preferred first name and class code to log in.</Text>
            <TextInput style={styles.input} placeholder="Student's Full Name" value={fullName} onChangeText={setFullName} />
            <TextInput style={styles.input} placeholder="Preferred First Name" value={preferredName} onChangeText={setPreferredName} />
            {message ? <Text style={styles.error}>{message}</Text> : null}
            <View style={styles.modalButtons}><TouchableOpacity style={styles.cancel} onPress={() => setShowAdd(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.save} onPress={addStudent} disabled={saving}><Text style={styles.saveText}>{saving ? "Saving..." : "Register"}</Text></TouchableOpacity></View>
          </View></ScrollView></KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  modalScroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 12 },
  container:{flex:1},safe:{flex:1},loading:{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor: Colors.teacherBackground },content:{ padding: 24, paddingBottom: 40, width: "100%", maxWidth: 880, alignSelf: "center", paddingHorizontal: 20 },back:{ alignSelf:"flex-start", backgroundColor: "transparent", borderRadius:22, paddingHorizontal: 0, paddingVertical:10, elevation: 0, minHeight: 44 },backText:{color:Colors.primary,fontWeight:"900",fontSize:16},hero:{ marginTop:18, backgroundColor: "transparent", borderRadius: 0, padding: 0, alignItems: "flex-start", elevation: 0 },heroEmoji:{ fontSize:52, display: "none" },title:{ fontSize: 30, fontWeight: "800", color: Colors.text, marginTop:5, lineHeight: 39 },subtitle:{ color: Colors.textSecondary, textAlign: "left", lineHeight: 23, marginTop:5, fontSize: 15 },codePill:{ marginTop:12, backgroundColor: "#DDEFFC", borderRadius: 10, paddingHorizontal:15, paddingVertical:8, borderWidth: 1, borderColor: Colors.teacherBorder },codePillText:{ color: "#36566F", fontWeight: "700", fontSize: 15, lineHeight: 22, letterSpacing: 0.4 },addButton:{ marginTop:14, backgroundColor: Colors.primary, borderRadius: 16, padding: 18, flexDirection:"row", alignItems:"center", elevation: 0, minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },addEmoji:{fontSize:30,marginRight:12},addTitle:{ color:Colors.white, fontSize: 17, fontWeight: "700" },addText:{ color:"#EAF3FF", fontSize: 13, marginTop:2, lineHeight: 20 },addArrow:{fontSize:28,color:Colors.white},section:{flexDirection:"row",alignItems:"center",marginTop:24,marginBottom:10},sectionTitle:{ fontSize: 20, fontWeight: "800", color: Colors.text, textShadowColor:"rgba(0,0,0,.12)", textShadowRadius: 0, lineHeight: 28 },count:{marginLeft:9,minWidth:28,textAlign:"center",backgroundColor:Colors.white,borderRadius:14,paddingVertical:4,color:Colors.primary,fontWeight:"900"},studentCard:{ backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom:11, flexDirection:"row", alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#C8DDEA", borderBottomWidth: 2 },avatar:{ width: 46, height: 46, borderRadius: 12, backgroundColor: "#DDEFFC", justifyContent:"center", alignItems:"center", marginRight:13 },name:{ fontSize: 18, fontWeight: "700", color: Colors.text, lineHeight: 25, flexShrink: 1 },fullName:{ fontSize: 14, color: Colors.textSecondary, marginTop:2, lineHeight: 21, flexShrink: 1 },stats:{ fontSize: 13, color: Colors.textSecondary, fontWeight: "500", marginTop:5, lineHeight: 21 },arrow:{fontSize:34,color:Colors.primary},empty:{ backgroundColor: Colors.white, borderRadius: 16, padding:28, alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#E1E7E5" },emptyEmoji:{fontSize:48},emptyTitle:{ fontSize:20, fontWeight: "800", color:Colors.text, marginTop:8, lineHeight: 28 },emptyText:{ textAlign:"center", color:Colors.textSecondary, lineHeight: 23, marginTop:5, fontSize: 15 },overlay:{flex:1,backgroundColor:"rgba(30,41,59,.45)",justifyContent:"center",padding:20},modalCard:{ backgroundColor: Colors.white, borderRadius: 24, padding: 22, elevation: 1, borderWidth: 1, borderColor: "#E1E7E5", width: "100%", maxWidth: 480, alignSelf: "center" },modalEmoji:{ fontSize:48, textAlign:"center", display: "none" },modalTitle:{ fontSize: 23, fontWeight: "800", color: Colors.text, textAlign: "left", marginTop:4, lineHeight: 31 },modalText:{ color: Colors.textSecondary, textAlign: "left", lineHeight: 23, marginTop:6, fontSize: 15 },input:{ marginTop:12, borderWidth: 1.5, borderColor: Colors.teacherBorder, borderRadius: 14, paddingHorizontal:14, paddingVertical:13, fontSize:16, color:Colors.text, backgroundColor: Colors.teacherBackground, minHeight: 52 },error:{color:"#B91C1C",fontWeight:"700",marginTop:10,lineHeight:19},modalButtons:{ flexDirection:"row", gap: 10, marginTop:18 },cancel:{ flex:1, backgroundColor:"#EEF4FF", borderRadius: 14, paddingVertical:14, alignItems:"center", minHeight: 48, borderWidth: 1, borderColor: Colors.teacherBorder },cancelText:{ color:"#275B8F", fontWeight: "700", fontSize: 15, lineHeight: 22 },save:{ flex:1, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical:14, alignItems:"center", minHeight: 48, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },saveText:{ color:Colors.white, fontWeight: "700", fontSize: 15, lineHeight: 22 },
});
