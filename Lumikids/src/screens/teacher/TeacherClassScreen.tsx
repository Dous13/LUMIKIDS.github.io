import React, { useCallback, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

  if (loading) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></SafeAreaView>;

  return (
    <LinearGradient colors={["#62B8FF", "#BFE8FF", "#FFF3C4"]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>← My Classes</Text></TouchableOpacity>

          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🏫</Text>
            <Text style={styles.title}>Class {classCode}</Text>
            <Text style={styles.subtitle}>Register learners and monitor how they are doing.</Text>
            <View style={styles.codePill}><Text style={styles.codePillText}>Class code: {classCode}</Text></View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={() => { setMessage(""); setShowAdd(true); }}>
            <Text style={styles.addEmoji}>👧</Text><View style={{flex:1}}><Text style={styles.addTitle}>Register a Student</Text><Text style={styles.addText}>Use the student's full name and preferred first name.</Text></View><Text style={styles.addArrow}>＋</Text>
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
                <View style={{flex:1}}><Text style={styles.name}>{student.preferredName || student.name}</Text><Text style={styles.fullName}>{student.fullName || student.name}</Text><Text style={styles.stats}>⭐ Lv.{student.level || 1}  ·  ⚡ {student.xp || 0} XP  ·  📚 {total} subject XP</Text></View>
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
  container:{flex:1},safe:{flex:1},loading:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#F8FCFF"},content:{padding:20,paddingBottom:40},back:{alignSelf:"flex-start",backgroundColor:"rgba(255,255,255,.92)",borderRadius:22,paddingHorizontal:15,paddingVertical:10,elevation:3},backText:{color:"#2563EB",fontWeight:"900",fontSize:16},hero:{marginTop:18,backgroundColor:"rgba(255,255,255,.94)",borderRadius:28,padding:22,alignItems:"center",elevation:6},heroEmoji:{fontSize:52},title:{fontSize:28,fontWeight:"900",color:"#1E3A8A",marginTop:5},subtitle:{color:"#64748B",textAlign:"center",lineHeight:20,marginTop:5},codePill:{marginTop:12,backgroundColor:"#FFF8D9",borderRadius:15,paddingHorizontal:15,paddingVertical:8},codePillText:{color:"#7C5D00",fontWeight:"900"},addButton:{marginTop:14,backgroundColor:"#2563EB",borderRadius:22,padding:16,flexDirection:"row",alignItems:"center",elevation:5},addEmoji:{fontSize:30,marginRight:12},addTitle:{color:"#FFF",fontSize:18,fontWeight:"900"},addText:{color:"#EAF3FF",fontSize:12,marginTop:2},addArrow:{fontSize:28,color:"#FFF"},section:{flexDirection:"row",alignItems:"center",marginTop:24,marginBottom:10},sectionTitle:{fontSize:23,fontWeight:"900",color:"#FFF",textShadowColor:"rgba(0,0,0,.12)",textShadowRadius:3},count:{marginLeft:9,minWidth:28,textAlign:"center",backgroundColor:"#FFF",borderRadius:14,paddingVertical:4,color:"#2563EB",fontWeight:"900"},studentCard:{backgroundColor:"rgba(255,255,255,.96)",borderRadius:24,padding:13,marginBottom:11,flexDirection:"row",alignItems:"center",elevation:4},avatar:{width:58,height:58,borderRadius:20,backgroundColor:"#EAF8FF",justifyContent:"center",alignItems:"center",marginRight:13},name:{fontSize:19,fontWeight:"900",color:"#334155"},fullName:{fontSize:13,color:"#64748B",marginTop:2},stats:{fontSize:12,color:"#475569",fontWeight:"700",marginTop:5},arrow:{fontSize:34,color:"#2563EB"},empty:{backgroundColor:"rgba(255,255,255,.94)",borderRadius:26,padding:28,alignItems:"center"},emptyEmoji:{fontSize:48},emptyTitle:{fontSize:20,fontWeight:"900",color:"#334155",marginTop:8},emptyText:{textAlign:"center",color:"#64748B",lineHeight:20,marginTop:5},overlay:{flex:1,backgroundColor:"rgba(30,41,59,.45)",justifyContent:"center",padding:20},modalCard:{backgroundColor:"#FFF",borderRadius:28,padding:24,elevation:12},modalEmoji:{fontSize:48,textAlign:"center"},modalTitle:{fontSize:24,fontWeight:"900",color:"#334155",textAlign:"center",marginTop:4},modalText:{color:"#64748B",textAlign:"center",lineHeight:20,marginTop:6},input:{marginTop:12,borderWidth:2,borderColor:"#D8EAF8",borderRadius:16,paddingHorizontal:14,paddingVertical:13,fontSize:16,color:"#334155",backgroundColor:"#F8FCFF"},error:{color:"#B91C1C",fontWeight:"700",marginTop:10,lineHeight:19},modalButtons:{flexDirection:"row",gap:10,marginTop:18},cancel:{flex:1,backgroundColor:"#EEF4FF",borderRadius:16,paddingVertical:14,alignItems:"center"},cancelText:{color:"#275B8F",fontWeight:"900"},save:{flex:1,backgroundColor:"#2563EB",borderRadius:16,paddingVertical:14,alignItems:"center"},saveText:{color:"#FFF",fontWeight:"900"},
});
