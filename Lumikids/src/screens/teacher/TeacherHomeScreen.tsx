import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  if (loading || !session) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></SafeAreaView>;

  return (
    <LinearGradient colors={["#62B8FF", "#BFE8FF", "#FFF3C4"]} style={styles.container}>
      <View style={styles.bubbleA} /><View style={styles.bubbleB} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>TEACHER HOME 👩‍🏫</Text>
              <Text style={styles.title}>Hi, {session.name}! 🌟</Text>
              <Text style={styles.subtitle}>Your learners are ready to grow.</Text>
            </View>
            <TouchableOpacity style={styles.logout} onPress={logout}><Text>🚪</Text></TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroEmoji}>🏫</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Your classroom hub</Text>
              <Text style={styles.heroText}>Create a class, register your learners, then monitor their progress.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateClass} disabled={creating}>
            <Text style={styles.createEmoji}>➕</Text>
            <View style={{ flex: 1 }}><Text style={styles.createTitle}>{creating ? "Creating class..." : "Create a New Class"}</Text><Text style={styles.createText}>Get a unique code for your learners.</Text></View>
          </TouchableOpacity>

          {newCode ? <View style={styles.codeCard}><Text style={styles.codeLabel}>NEW CLASS CODE</Text><Text style={styles.code}>{newCode}</Text><Text style={styles.codeHint}>Give this code to your registered learners.</Text></View> : null}

          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>My Classes</Text><Text style={styles.count}>{classes.length}</Text></View>

          {classes.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyEmoji}>📚</Text><Text style={styles.emptyTitle}>No classes yet</Text><Text style={styles.emptyText}>Create your first class to start registering students.</Text></View>
          ) : classes.map(item => (
            <TouchableOpacity key={item.id} style={styles.classCard} activeOpacity={0.88} onPress={() => navigation.navigate("TeacherClass", { classCode: item.code })}>
              <View style={styles.classIcon}><Text>🏫</Text></View>
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
  container:{flex:1},safe:{flex:1},loading:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#F8FCFF"},content:{padding:20,paddingBottom:40},bubbleA:{position:"absolute",width:260,height:260,borderRadius:130,backgroundColor:"rgba(255,255,255,.18)",top:-90,right:-80},bubbleB:{position:"absolute",width:180,height:180,borderRadius:90,backgroundColor:"rgba(255,255,255,.15)",bottom:100,left:-90},headerRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},kicker:{fontSize:12,fontWeight:"900",letterSpacing:1.2,color:"#2563EB"},title:{marginTop:2,fontSize:29,fontWeight:"900",color:"#1E3A8A"},subtitle:{marginTop:4,color:"#475569",fontSize:15},logout:{width:46,height:46,borderRadius:23,backgroundColor:"rgba(255,255,255,.9)",justifyContent:"center",alignItems:"center",elevation:3},heroCard:{marginTop:18,backgroundColor:"rgba(255,255,255,.94)",borderRadius:28,padding:20,flexDirection:"row",alignItems:"center",elevation:6},heroEmoji:{fontSize:48,marginRight:15},heroTitle:{fontSize:21,fontWeight:"900",color:"#334155"},heroText:{marginTop:4,color:"#64748B",lineHeight:20},createButton:{marginTop:14,backgroundColor:"#2563EB",borderRadius:22,padding:17,flexDirection:"row",alignItems:"center",elevation:5},createEmoji:{fontSize:27,marginRight:12},createTitle:{color:"#FFF",fontSize:18,fontWeight:"900"},createText:{color:"#EAF3FF",marginTop:2,fontSize:13},codeCard:{marginTop:14,backgroundColor:"#FFF8D9",borderRadius:24,padding:18,alignItems:"center",borderWidth:2,borderColor:"#F4D76A"},codeLabel:{fontSize:11,fontWeight:"900",letterSpacing:1,color:"#9A6700"},code:{fontSize:36,fontWeight:"900",letterSpacing:5,color:"#7C5D00",marginTop:3},codeHint:{marginTop:4,color:"#7C5D00",fontWeight:"700"},sectionRow:{flexDirection:"row",alignItems:"center",marginTop:24,marginBottom:10},sectionTitle:{fontSize:23,fontWeight:"900",color:"#FFF",textShadowColor:"rgba(0,0,0,.12)",textShadowRadius:3},count:{marginLeft:9,minWidth:28,textAlign:"center",backgroundColor:"#FFF",borderRadius:14,paddingVertical:4,color:"#2563EB",fontWeight:"900"},classCard:{backgroundColor:"rgba(255,255,255,.96)",borderRadius:24,padding:14,marginBottom:11,flexDirection:"row",alignItems:"center",elevation:4},classIcon:{width:58,height:58,borderRadius:20,backgroundColor:"#EAF8FF",justifyContent:"center",alignItems:"center",marginRight:13},className:{fontSize:19,fontWeight:"900",color:"#334155"},classCode:{marginTop:3,color:"#64748B",fontWeight:"700"},arrow:{fontSize:34,color:"#2563EB"},empty:{backgroundColor:"rgba(255,255,255,.94)",borderRadius:26,padding:30,alignItems:"center"},emptyEmoji:{fontSize:48},emptyTitle:{fontSize:20,fontWeight:"900",color:"#334155",marginTop:8},emptyText:{textAlign:"center",color:"#64748B",lineHeight:20,marginTop:4},
});
