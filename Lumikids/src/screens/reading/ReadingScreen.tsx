import AnimatedProgress from "../../components/common/AnimatedProgress";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { readingLessons } from "../../data/readingLessons";
import { getAllProgress } from "../../services/database/localProgress";
import { getSession } from "../../services/session/session";

export default function ReadingScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<any[]>([]);

  const loadProgress = useCallback(async () => {
    const session = await getSession();
    console.log("[READING] Current student ID:", session?.studentId);

    if (session) {
      const savedProgress = getAllProgress(session.studentId);
      console.log("[READING] Saved progress:", savedProgress);
      setProgress(savedProgress as any[]);
    }
    if (session) setProgress(getAllProgress(session.studentId) as any[]);
  }, []);

  useFocusEffect(useCallback(() => { loadProgress(); }, [loadProgress]));

  const map = Object.fromEntries(progress.map(item => [item.lessonId, item]));
  const completed = progress.filter(item => item.completed === 1).length;
  const percent = readingLessons.length ? (completed / readingLessons.length) * 100 : 0;

  return (
    <LinearGradient colors={["#EAF7FF", "#EAF7FF"]} style={styles.container}>
      <View style={styles.bubbleOne} /><View style={styles.bubbleTwo} /><View style={styles.starOne} /><View style={styles.starTwo} />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={readingLessons}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color="#176BC1" />
                <Text style={styles.backText}>Home</Text>
              </TouchableOpacity>

              <FadeIn style={styles.hero}>
                <View style={styles.heroDecorLeft}><Text>☁️</Text></View>
                <View style={styles.heroDecorRight}><Text>⭐</Text></View>
                <Text style={styles.heroEmoji}>📖</Text>
                <Text style={styles.kicker}>READING ADVENTURE</Text>
                <Text style={styles.title}>Let's Read & Play! 🎉</Text>
                <Text style={styles.subtitle}>Learn letters, sounds, and simple words through a fun little adventure.</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>🌟 {completed}/{readingLessons.length} lessons</Text>
                  <Text style={styles.percent}>{Math.round(percent)}%</Text>
                </View>
                <AnimatedProgress value={percent} color="#FFCD54" style={styles.track} />
              </FadeIn>

              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Pick a lesson</Text>
                <Text style={styles.sectionEmoji}>🧸</Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const unlocked = map[item.id]?.unlocked === 1 || index === 0;
            const done = map[item.id]?.completed === 1;
            return (
              <TouchableOpacity
                disabled={!unlocked}
                activeOpacity={0.88}
                style={[styles.lesson, !unlocked && styles.locked]}
                onPress={() => navigation.navigate("Lesson", { lessonId: item.id })}
              >
                <View style={[styles.lessonIcon, { backgroundColor: item.color }]}>
                  <Text style={styles.lessonEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.lessonBody}>
                  <Text style={styles.lessonTitle}>{item.letter}</Text>
                  <Text style={styles.lessonWord}>{item.word}</Text>
                  <View style={styles.xpPill}><Text style={styles.lessonMeta}>⭐ +{item.xp} XP</Text></View>
                </View>
                <View style={[styles.status, { backgroundColor: done ? "#DDF8E5" : unlocked ? "#E8F3FF" : "#EEF2F7" }]}>
                  <Text style={styles.statusText}>{done ? "✓" : unlocked ? "›" : "🔒"}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:{flex:1}, safeArea:{flex:1}, content:{ paddingHorizontal:20, paddingBottom:38, width: "100%", maxWidth: 720, alignSelf: "center", paddingTop: 10 },
  bubbleOne:{ position:"absolute", width:180, height:180, borderRadius:90, backgroundColor:"rgba(255,255,255,.18)", top:-65, right:-50, display: "none" },
  bubbleTwo:{ position:"absolute", width:110, height:110, borderRadius:55, backgroundColor:"rgba(255,255,255,.16)", bottom:80, left:-45, display: "none" },
  starOne:{ position:"absolute", top:135, left:18, display: "none" }, starTwo:{ position:"absolute", top:285, right:20, display: "none" },
  backButton:{ flexDirection:"row", alignItems:"center", alignSelf:"flex-start", backgroundColor: "transparent", borderRadius:22, paddingHorizontal: 0, paddingVertical:9, elevation: 0, marginTop:6, minHeight: 44 },
  backText:{marginLeft:7,color:"#176BC1",fontSize:16,fontWeight:"900"},
  hero:{ marginTop:14, borderRadius: 24, padding: 24, backgroundColor: "#C9462C", alignItems:"center", overflow:"hidden", elevation: 0 },
  heroDecorLeft:{ position:"absolute", left:12, top:18, display: "none" },heroDecorRight:{ position:"absolute", right:14, top:18, display: "none" },
  heroEmoji:{ fontSize: 44, marginTop:3 }, kicker:{ marginTop: 8, fontSize: 11, fontWeight:"900", letterSpacing: 1.8, color: "#FFFFFF" },
  title:{ marginTop: 8, fontSize: 27, fontWeight:"900", color: "#FFFFFF", textAlign:"center", lineHeight: 34 },
  subtitle:{ marginTop:7, fontSize: 16, lineHeight: 24, color: "#FFFFFF", textAlign:"center" },
  progressRow:{width:"100%",flexDirection:"row",justifyContent:"space-between",marginTop:18},progressLabel:{ fontWeight:"900", color: "#FFFFFF" },percent:{ fontWeight:"900", color: "#FFFFFF" },
  track:{ width:"100%", height:11, backgroundColor: "rgba(255,255,255,0.26)", borderRadius:20, overflow:"hidden", marginTop:8 },fill:{height:"100%",backgroundColor:"#58C977",borderRadius:20},
  sectionRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:22,marginBottom:10,paddingHorizontal:3},sectionTitle:{ fontSize: 21, fontWeight: "800", color: "#23394A", textShadowColor:"rgba(0,0,0,.12)", textShadowRadius: 0 },sectionEmoji:{ fontSize:28, display: "none" },
  lesson:{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 10, flexDirection:"row", alignItems:"center", elevation: 1, borderWidth: 1, borderColor: "#F2B49D", borderLeftWidth: 4 },locked:{ opacity: 0.6 },
  lessonIcon:{ width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },lessonEmoji:{ fontSize: 34, textAlign: "center", textAlignVertical: "center", includeFontPadding: false },lessonBody:{ flex:1, marginLeft:13, minWidth: 0 },lessonTitle:{ fontSize:22, fontWeight: "800", color: "#C9462C" },lessonWord:{fontSize:15,fontWeight:"700",color:"#64748B",marginTop:1},
  xpPill:{ alignSelf:"flex-start", backgroundColor: "#FFE49B", borderRadius:12, paddingHorizontal:8, paddingVertical:3, marginTop:5 },lessonMeta:{ fontSize:12, fontWeight:"900", color: "#6D4C07" },
  status:{ width:42, height:42, borderRadius:21, justifyContent: "center", alignItems: "center" },statusText:{ fontSize:21, fontWeight:"900", color: "#C9462C", textAlign: "center", textAlignVertical: "center", includeFontPadding: false },
});
