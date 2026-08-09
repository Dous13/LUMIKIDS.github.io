import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
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
    <LinearGradient colors={["#62B8FF", "#A9DDFF", "#FFF3C4"]} style={styles.container}>
      <View style={styles.circleOne}/><View style={styles.circleTwo}/><View style={styles.doodle}><Text>✨</Text></View>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={writingLessons} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
          ListHeaderComponent={<View>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#2563EB"/><Text style={styles.backText}>Home</Text></TouchableOpacity>
            <View style={styles.hero}>
              <View style={styles.cloudLeft}><Text>☁️</Text></View><View style={styles.cloudRight}><Text>🌈</Text></View>
              <Text style={styles.heroEmoji}>✏️</Text><Text style={styles.kicker}>WRITING ADVENTURE</Text>
              <Text style={styles.title}>Draw, Trace & Create! 🖍️</Text>
              <Text style={styles.subtitle}>Practice letters and words while making every stroke your own.</Text>
              <View style={styles.progressRow}><Text style={styles.progressLabel}>🎨 {completed}/{writingLessons.length} lessons</Text><Text style={styles.percent}>{Math.round(percent)}%</Text></View>
              <View style={styles.track}><View style={[styles.fill,{width:`${percent}%`}]}/></View>
            </View>
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
 container:{flex:1},safeArea:{flex:1},content:{paddingHorizontal:20,paddingBottom:38},circleOne:{position:"absolute",width:260,height:260,borderRadius:130,backgroundColor:"rgba(255,255,255,.16)",top:-100,right:-90},circleTwo:{position:"absolute",width:140,height:140,borderRadius:70,backgroundColor:"rgba(255,255,255,.18)",bottom:70,left:-60},doodle:{position:"absolute",top:155,right:18},
 backButton:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",backgroundColor:"rgba(255,255,255,.94)",borderRadius:22,paddingHorizontal:14,paddingVertical:9,elevation:3,marginTop:6},backText:{marginLeft:7,color:"#2563EB",fontSize:16,fontWeight:"900"},
 hero:{marginTop:14,borderRadius:32,padding:22,backgroundColor:"rgba(255,255,255,.95)",alignItems:"center",overflow:"hidden",elevation:7},cloudLeft:{position:"absolute",left:12,top:17},cloudRight:{position:"absolute",right:12,top:17},heroEmoji:{fontSize:55},kicker:{marginTop:5,fontSize:12,fontWeight:"900",letterSpacing:1.4,color:"#2563EB"},title:{marginTop:3,fontSize:27,fontWeight:"900",color:"#2563EB",textAlign:"center"},subtitle:{marginTop:7,fontSize:15,lineHeight:21,color:"#64748B",textAlign:"center"},progressRow:{width:"100%",flexDirection:"row",justifyContent:"space-between",marginTop:18},progressLabel:{fontWeight:"900",color:"#334155"},percent:{fontWeight:"900",color:"#16A34A"},track:{width:"100%",height:11,backgroundColor:"#E8DFFC",borderRadius:20,overflow:"hidden",marginTop:8},fill:{height:"100%",backgroundColor:"#9B6DFF",borderRadius:20},
 sectionRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:22,marginBottom:10,paddingHorizontal:3},sectionTitle:{fontSize:22,fontWeight:"900",color:"#FFFFFF",textShadowColor:"rgba(0,0,0,.14)",textShadowRadius:3},sectionEmoji:{fontSize:28},lesson:{backgroundColor:"rgba(255,255,255,.96)",borderRadius:24,padding:13,marginBottom:12,flexDirection:"row",alignItems:"center",elevation:4},locked:{opacity:.52},lessonIcon:{width:62,height:62,borderRadius:21,justifyContent:"center",alignItems:"center"},lessonEmoji:{fontSize:36},lessonBody:{flex:1,marginLeft:13},lessonTitle:{fontSize:22,fontWeight:"900",color:"#1E293B"},lessonWord:{fontSize:15,fontWeight:"700",color:"#64748B",marginTop:1},xpPill:{alignSelf:"flex-start",backgroundColor:"#FFF4CC",borderRadius:12,paddingHorizontal:8,paddingVertical:3,marginTop:5},lessonMeta:{fontSize:12,fontWeight:"900",color:"#9A6700"},status:{width:42,height:42,borderRadius:21,justifyContent:"center",alignItems:"center"},statusText:{fontSize:21,fontWeight:"900",color:"#7C3AED"}
});
