import { Colors } from "../../theme";
import AnimatedProgress from "../../components/common/AnimatedProgress";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { writingLessons } from "../../data/writingLessons";
import { getAllWritingProgress } from "../../services/database/localWriting";
import { getSession } from "../../services/session/session";

export default function WritingScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<any[]>([]);
  const loadProgress = useCallback(async () => { const session = await getSession(); if (session) setProgress(getAllWritingProgress(session.studentId) as any[]); }, []);
  useFocusEffect(useCallback(() => { loadProgress(); }, [loadProgress]));
  const map = Object.fromEntries(progress.map(item => [item.lessonId, item]));
  const completed = progress.filter(item => item.completed === 1).length;
  const percent = writingLessons.length ? (completed / writingLessons.length) * 100 : 0;

  return (
    <LinearGradient colors={[Colors.background, Colors.background]} style={styles.container}>
      <View style={styles.circleOne}/><View style={styles.circleTwo}/><View style={styles.doodle}><Text>✨</Text></View>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={writingLessons} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
          ListHeaderComponent={<View>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={Colors.primary}/><Text style={styles.backText}>Home</Text></TouchableOpacity>
            <FadeIn style={styles.hero}>
              <View style={styles.cloudLeft}><Text>☁️</Text></View><View style={styles.cloudRight}><Text>🌈</Text></View>
              <Text style={styles.heroEmoji}>✏️</Text><Text style={styles.kicker}>WRITING ADVENTURE</Text>
              <Text style={styles.title}>Draw, Trace & Create! 🖍️</Text>
              <Text style={styles.subtitle}>Practice letters and words while making every stroke your own.</Text>
              <View style={styles.progressRow}><Text style={styles.progressLabel}>🎨 {completed}/{writingLessons.length} lessons</Text><Text style={styles.percent}>{Math.round(percent)}%</Text></View>
              <AnimatedProgress value={percent} color={Colors.sunshine} style={styles.track} />
            </FadeIn>
            <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Choose a letter</Text><Text style={styles.sectionEmoji}>🖍️</Text></View>
          </View>}
          renderItem={({item,index}) => {
            const unlocked = map[item.id]?.unlocked === 1 || index === 0; const done = map[item.id]?.completed === 1;
            return <TouchableOpacity disabled={!unlocked} activeOpacity={.88} style={[styles.lesson,!unlocked&&styles.locked]} onPress={()=>navigation.navigate("WritingLesson",{lessonId:item.id})}>
              <View style={[styles.lessonIcon,{backgroundColor:item.color}]}><Text style={styles.lessonEmoji}>{item.emoji}</Text></View>
              <View style={styles.lessonBody}><Text style={styles.lessonTitle}>{item.letter}</Text><Text style={styles.lessonWord}>{item.word}</Text><View style={styles.xpPill}><Text style={styles.lessonMeta}>⭐ +{item.xp} XP</Text></View></View>
              <View style={[styles.status,{backgroundColor:done?"#DDF8E5":unlocked?"#F0E9FF":"#EEF2F7"}]}><Text style={styles.statusText}>{done?"✓":unlocked?"›":"🔒"}</Text></View>
            </TouchableOpacity>;
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles=StyleSheet.create({
 container:{flex:1},safeArea:{flex:1},content:{ paddingHorizontal:20, paddingBottom:38, width: "100%", maxWidth: 720, alignSelf: "center", paddingTop: 10 },circleOne:{ position:"absolute", width:260, height:260, borderRadius:130, backgroundColor:"rgba(255,255,255,.16)", top:-100, right:-90, display: "none" },circleTwo:{ position:"absolute", width:140, height:140, borderRadius:70, backgroundColor:"rgba(255,255,255,.18)", bottom:70, left:-60, display: "none" },doodle:{ position:"absolute", top:155, right:18, display: "none" },
 backButton:{ flexDirection:"row", alignItems:"center", alignSelf:"flex-start", backgroundColor: "transparent", borderRadius:22, paddingHorizontal: 0, paddingVertical:9, elevation: 0, marginTop:6, minHeight: 44 },backText:{ marginLeft:7, color: Colors.writing, fontSize:16, fontWeight: "700" },
 hero:{ marginTop:14, borderRadius: 24, padding: 24, backgroundColor: Colors.writing, alignItems:"center", overflow:"hidden", elevation: 0, borderBottomWidth: 4, borderBottomColor: Colors.writingDark },cloudLeft:{ position:"absolute", left:12, top:17, display: "none" },cloudRight:{ position:"absolute", right:12, top:17, display: "none" },heroEmoji:{ fontSize: 44 },kicker:{ marginTop: 8, fontSize: 11, fontWeight: "800", letterSpacing: 1.8, color: Colors.white },title:{ marginTop: 8, fontSize: 27, fontWeight: "800", color: Colors.white, textAlign:"center", lineHeight: 34 },subtitle:{ marginTop:7, fontSize: 16, lineHeight: 24, color: Colors.white, textAlign:"center" },progressRow:{ width:"100%", flexDirection:"row", justifyContent:"space-between", marginTop:18, alignItems: "center", gap: 8 },progressLabel:{ fontWeight:"900", color: Colors.white, flexShrink: 1 },percent:{ fontWeight: "800", color: Colors.white },track:{ width:"100%", height:11, backgroundColor: "rgba(255,255,255,0.26)", borderRadius:20, overflow:"hidden", marginTop:8 },fill:{height:"100%",backgroundColor:"#9B6DFF",borderRadius:20},
 sectionRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:22,marginBottom:10,paddingHorizontal:3},sectionTitle:{ fontSize: 21, fontWeight: "800", color: Colors.text, textShadowColor:"rgba(0,0,0,.14)", textShadowRadius: 0, lineHeight: 28 },sectionEmoji:{ fontSize:28, display: "none" },lesson:{ backgroundColor: Colors.white, borderRadius: 20, padding: 16, marginBottom: 10, flexDirection:"row", alignItems:"center", elevation: 2, borderWidth: 1, borderColor: Colors.writingBorder, borderLeftWidth: 4, shadowColor: Colors.text, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: {"width":0,"height":3} },locked:{ opacity: 0.65, backgroundColor: Colors.lockedSurface, borderColor: Colors.border, elevation: 0, shadowOpacity: 0 },lessonIcon:{ width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },lessonEmoji:{ fontSize: 34, textAlign: "center", textAlignVertical: "center", includeFontPadding: false },lessonBody:{ flex:1, marginLeft:13, minWidth: 0 },lessonTitle:{ fontSize:22, fontWeight: "800", color: Colors.writing, flexShrink: 1 },lessonWord:{fontSize:15,fontWeight:"700",color:Colors.textSecondary,marginTop:1},xpPill:{ alignSelf:"flex-start", backgroundColor: "#FFE49B", borderRadius:12, paddingHorizontal:8, paddingVertical:3, marginTop:5 },lessonMeta:{ fontSize: 13, fontWeight: "700", color: "#6D4C07", lineHeight: 19 },status:{ width:42, height:42, borderRadius:21, justifyContent: "center", alignItems: "center" },statusText:{ fontSize:21, fontWeight:"900", color: Colors.writing, textAlign: "center", textAlignVertical: "center", includeFontPadding: false }
});
