import { Colors } from "../../theme";
import { Ionicons } from "@expo/vector-icons";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getTeacherClasses, createClass } from "../../services/teacher/teacherService";
import { getTeacherSession, clearTeacherSession } from "../../services/teacher/teacherSession";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase/firebase";

export default function TeacherHomeScreen() {
  const navigation = useNavigation<any>();
  const [session, setSession] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");

  const load = useCallback(async () => {
    const s = await getTeacherSession();
    if (!s) {
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      return;
    }
    setSession(s);
    setClasses(await getTeacherClasses(s.teacherId));
    setLoading(false);
  }, [navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleCreateClass() {
    if (!session || creating) return;
    try {
      setCreating(true);
      const code = await createClass(session.teacherId, session.name);
      setNewCode(code);
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function logout() {
    await signOut(auth).catch(() => undefined);
    await clearTeacherSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }

  if (loading || !session) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  return (
    <LinearGradient colors={[Colors.teacherBackground, Colors.teacherBackground]} style={styles.container}>
      <View style={styles.bubbleA} /><View style={styles.bubbleB} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} contentContainerStyle={styles.content}>
          <FadeIn style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>LUMIKIDS / TEACHER</Text>
              <Text style={styles.title}>Hi, {session.name}!</Text>
              <Text style={styles.subtitle}>Your learners are ready to grow.</Text>
            </View>
            <TouchableOpacity style={styles.logout} onPress={logout}><Ionicons name="log-out-outline" size={22} color="#36566F" /></TouchableOpacity>
          </FadeIn>

          <FadeIn delay={40} style={styles.heroCard}>
            <View style={{ marginRight: 16 }}><Ionicons name="school-outline" size={30} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Your classroom hub</Text>
              <Text style={styles.heroText}>Create a class, register your learners, then monitor their progress.</Text>
            </View>
          </FadeIn>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateClass} disabled={creating}>
            <View style={{ marginRight: 12 }}><Ionicons name="add" size={24} color="#FFFFFF" /></View>
            <View style={{ flex: 1 }}><Text style={styles.createTitle}>{creating ? "Creating class..." : "Create a New Class"}</Text><Text style={styles.createText}>Get a unique code for your learners.</Text></View>
          </TouchableOpacity>

          {newCode ? <View style={styles.codeCard}><Text style={styles.codeLabel}>NEW CLASS CODE</Text><Text style={styles.code}>{newCode}</Text><Text style={styles.codeHint}>Give this code to your registered learners.</Text></View> : null}

          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>My Classes</Text><Text style={styles.count}>{classes.length}</Text></View>

          {classes.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyEmoji}>📚</Text><Text style={styles.emptyTitle}>No classes yet</Text><Text style={styles.emptyText}>Create your first class to start registering students.</Text></View>
          ) : classes.map(item => (
            <TouchableOpacity key={item.id} style={styles.classCard} activeOpacity={0.88} onPress={() => navigation.navigate("TeacherClass", { classCode: item.code })}>
              <View style={styles.classIcon}><Ionicons name="school-outline" size={24} color="#36566F" /></View>
              <View style={{ flex: 1 }}><Text style={styles.className}>{item.name || "My Class"}</Text><Text style={styles.classCode}>Code: {item.code}</Text></View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1},safe:{flex:1},loading:{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor: Colors.teacherBackground },content:{ padding: 24, paddingBottom: 40, width: "100%", maxWidth: 880, alignSelf: "center", paddingHorizontal: 20 },bubbleA:{ position:"absolute", width:260, height:260, borderRadius:130, backgroundColor:"rgba(255,255,255,.18)", top:-90, right:-80, display: "none" },bubbleB:{ position:"absolute", width:180, height:180, borderRadius:90, backgroundColor:"rgba(255,255,255,.15)", bottom:100, left:-90, display: "none" },headerRow:{flexDirection:"row",alignItems:"center",width:"100%",paddingHorizontal:2},headerText:{flex:1,minWidth:0,paddingRight:12},kicker:{ fontSize: 11, fontWeight: "700", letterSpacing: 1.6, color: Colors.primary },title:{ marginTop: 6, fontSize: 29, fontWeight: "800", color: Colors.text, lineHeight: 38 },subtitle:{ marginTop:4, color: Colors.textSecondary, fontSize:15, lineHeight: 23, flexShrink:1 },logout:{ width:46, height:46, marginLeft:8, borderRadius: 14, backgroundColor: "#E9EFF2", justifyContent:"center", alignItems:"center", elevation: 0, borderWidth: 1, borderColor: Colors.teacherBorder },heroCard:{ marginTop:18, backgroundColor: "#DDEFFC", borderRadius: 16, padding: 20, flexDirection:"row", alignItems:"center", elevation: 0, borderWidth: 1, borderColor: Colors.teacherBorder },heroEmoji:{ fontSize: 30, marginRight: 16 },heroTitle:{ fontSize: 19, fontWeight: "800", color: Colors.text, lineHeight: 26 },heroText:{ marginTop:4, color: Colors.textSecondary, lineHeight: 23, flexShrink:1, fontSize: 15 },createButton:{ marginTop:14, backgroundColor: Colors.primary, borderRadius: 16, padding: 18, flexDirection:"row", alignItems:"center", elevation: 0, minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },createEmoji:{ fontSize: 24, marginRight:12 },createTitle:{ color:Colors.white, fontSize: 17, fontWeight: "700" },createText:{color:"#EAF3FF",marginTop:2,fontSize:13,lineHeight:18,flexShrink:1},codeCard:{ marginTop:14, backgroundColor: "#EDF5F1", borderRadius: 16, padding:18, alignItems:"center", borderWidth: 1, borderColor: "#CDDFD3" },codeLabel:{ fontSize:11, fontWeight:"900", letterSpacing:1, color: "#356750" },code:{ fontSize: 32, fontWeight:"900", letterSpacing: 4, color: "#245E46", marginTop:3, lineHeight: 43 },codeHint:{ marginTop:4, color: "#356750", fontWeight: "500", textAlign:"center", lineHeight: 21, fontSize: 14 },sectionRow:{flexDirection:"row",alignItems:"center",marginTop:24,marginBottom:10},sectionTitle:{ fontSize: 20, fontWeight: "800", color: Colors.text, textShadowColor:"rgba(0,0,0,.12)", textShadowRadius: 0, lineHeight: 28 },count:{ marginLeft:9, minWidth:28, textAlign:"center", backgroundColor: Colors.teacherSurface, borderRadius:14, paddingVertical:4, color:Colors.primary, fontWeight:"900", paddingHorizontal: 8, fontSize: 13 },classCard:{ backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom:11, flexDirection:"row", alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#C8DDEA", borderBottomWidth: 2 },classIcon:{ width: 46, height: 46, borderRadius: 12, backgroundColor: "#DDEFFC", justifyContent: "center", alignItems: "center", marginRight:13 },className:{ fontSize: 18, lineHeight: 26, fontWeight: "700", color: Colors.text, flexShrink:1 },classCode:{ marginTop:3, color: Colors.textSecondary, fontWeight: "500", lineHeight: 21, fontSize: 14 },arrow:{fontSize:34,color:Colors.primary},empty:{ backgroundColor: Colors.white, borderRadius: 16, padding:30, alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#E1E7E5" },emptyEmoji:{fontSize:48},emptyTitle:{ fontSize: 20, fontWeight: "800", color:Colors.text, marginTop:8, lineHeight: 28 },emptyText:{ textAlign:"center", color:Colors.textSecondary, lineHeight: 23, marginTop:4, fontSize: 15 },
});
