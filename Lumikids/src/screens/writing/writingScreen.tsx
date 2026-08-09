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

  const loadProgress = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    setProgress(getAllWritingProgress(session.studentId) as any[]);
  }, []);

  useFocusEffect(useCallback(() => { loadProgress(); }, [loadProgress]));

  const progressMap = Object.fromEntries(progress.map(item => [item.lessonId, item]));
  const completed = progress.filter(item => item.completed === 1).length;
  const percent = writingLessons.length ? (completed / writingLessons.length) * 100 : 0;

  return (
    <LinearGradient colors={["#F8FCFF", "#EAF8FF", "#D8F4FF"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={writingLessons}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={25} color="#618FF1" />
                <Text style={styles.backText}>Home</Text>
              </TouchableOpacity>
              <View style={styles.heroCard}>
                <Text style={styles.owl}>🦉</Text>
                <Text style={styles.heroTitle}>Writing Adventure</Text>
                <Text style={styles.heroSubtitle}>Trace letters, practice words, and build your writing skills!</Text>
                <Text style={styles.progressText}>{completed} of {writingLessons.length} letters completed</Text>
                <View style={styles.progressBackground}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View>
              </View>
            </>
          }
          renderItem={({ item }) => {
            const unlocked = progressMap[item.id]?.unlocked === 1 || item.id === writingLessons[0]?.id;
            const done = progressMap[item.id]?.completed === 1;
            return (
              <TouchableOpacity
                activeOpacity={0.88}
                disabled={!unlocked}
                style={[styles.lessonCard, { backgroundColor: item.color }, !unlocked && styles.locked]}
                onPress={() => navigation.navigate("WritingLesson", { lessonId: item.id })}
              >
                <Text style={styles.lessonEmoji}>{item.emoji}</Text>
                <View style={styles.lessonBody}>
                  <Text style={styles.lessonTitle}>Letter {item.letter}</Text>
                  <Text style={styles.lessonWord}>{item.word}</Text>
                  <Text style={styles.reward}>⭐ +{item.xp} XP</Text>
                  <Text style={styles.status}>{done ? "✓ Completed" : unlocked ? "▶ Start writing" : "🔒 Complete the previous letter first"}</Text>
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
  container: { flex: 1 }, safeArea: { flex: 1 }, content: { padding: 20, paddingBottom: 40 },
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 8, marginBottom: 10 }, backText: { marginLeft: 7, fontWeight: "700", fontSize: 18, color: "#618FF1" },
  heroCard: { backgroundColor: "#FFF", borderRadius: 26, padding: 20, alignItems: "center", elevation: 4, marginBottom: 16 }, owl: { fontSize: 48 }, heroTitle: { fontSize: 28, fontWeight: "900", color: "#1E3A8A", marginTop: 4 }, heroSubtitle: { marginTop: 6, textAlign: "center", color: "#64748B", fontSize: 15, lineHeight: 21 }, progressText: { marginTop: 14, color: "#334155", fontWeight: "800" }, progressBackground: { width: "100%", height: 11, borderRadius: 20, backgroundColor: "#E5E7EB", overflow: "hidden", marginTop: 9 }, progressFill: { height: "100%", backgroundColor: "#57C36A", borderRadius: 20 },
  lessonCard: { borderRadius: 26, padding: 19, marginBottom: 14, flexDirection: "row", alignItems: "center", elevation: 3 }, locked: { opacity: 0.5 }, lessonEmoji: { fontSize: 48, marginRight: 14 }, lessonBody: { flex: 1 }, lessonTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B" }, lessonWord: { marginTop: 2, fontSize: 16, color: "#475569", fontWeight: "700" }, reward: { marginTop: 6, color: "#7C5D00", fontWeight: "800" }, status: { marginTop: 6, color: "#2563EB", fontWeight: "800", fontSize: 13 },
});
