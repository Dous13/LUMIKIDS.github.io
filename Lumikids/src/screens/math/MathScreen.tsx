import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { mathLessons } from "../../data/mathLessons";
import { getSession } from "../../services/session/session";
import { getAllMathProgress } from "../../services/database/localMath";

export default function MathScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<any[]>([]);

  const loadProgress = useCallback(async () => {
    const session = await getSession();
    if (!session) return;
    setProgress(getAllMathProgress(session.studentId));
  }, []);

  useFocusEffect(useCallback(() => { loadProgress(); }, [loadProgress]));

  const progressMap = Object.fromEntries(progress.map(item => [item.lessonId, item]));
  const completed = progress.filter(item => item.completed === 1).length;

  return (
    <LinearGradient colors={["#F8FCFF", "#EAF8FF", "#D6F1FF"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={mathLessons}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.headerCard}>
                <Text style={styles.headerEmoji}>🔢</Text>
                <Text style={styles.title}>Math Adventure</Text>
                <Text style={styles.subtitle}>Learn numbers, counting and simple math through fun games!</Text>
                <Text style={styles.progressSummary}>{completed} of {mathLessons.length} lessons completed</Text>
              </View>
            </>
          }
          renderItem={({ item }) => {
            const unlocked = progressMap[item.id]?.unlocked === 1 || item.id === mathLessons[0]?.id;
            const completedLesson = progressMap[item.id]?.completed === 1;
            return (
              <TouchableOpacity
                style={[styles.lessonCard, !unlocked && styles.lockedCard]}
                activeOpacity={0.9}
                disabled={!unlocked}
                onPress={() => navigation.navigate("MathLesson", { lessonId: item.id })}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.lessonBody}>
                  <Text style={styles.lessonTitle}>{item.title}</Text>
                  <Text style={styles.lessonDescription}>{item.description}</Text>
                  <Text style={styles.lessonStatus}>
                    {completedLesson ? "✓ Completed" : unlocked ? "▶ Start lesson" : "🔒 Complete the previous lesson first"}
                  </Text>
                </View>
                <View style={styles.xpBadge}><Text style={styles.xpText}>⭐ {item.xpReward}</Text></View>
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
  backButton: { alignSelf: "flex-start", paddingVertical: 8, marginBottom: 10 }, backText: { fontSize: 18, fontWeight: "700", color: "#5A6C7D" },
  headerCard: { backgroundColor: "#FFF", borderRadius: 24, padding: 22, alignItems: "center", marginBottom: 18, elevation: 3 }, headerEmoji: { fontSize: 50 },
  title: { fontSize: 28, fontWeight: "900", color: "#334155", marginTop: 6 }, subtitle: { textAlign: "center", color: "#64748B", fontSize: 15, marginTop: 8, lineHeight: 22 }, progressSummary: { marginTop: 12, color: "#16A34A", fontWeight: "800" },
  lessonCard: { backgroundColor: "#FFF", borderRadius: 22, padding: 17, marginBottom: 14, flexDirection: "row", alignItems: "center", elevation: 2 }, lockedCard: { opacity: 0.55 }, emoji: { fontSize: 45, marginRight: 14 }, lessonBody: { flex: 1 }, lessonTitle: { fontSize: 19, fontWeight: "800", color: "#334155" }, lessonDescription: { color: "#64748B", marginTop: 4, fontSize: 14, lineHeight: 19 }, lessonStatus: { marginTop: 8, color: "#2563EB", fontWeight: "800", fontSize: 13 }, xpBadge: { backgroundColor: "#FFE082", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, marginLeft: 8 }, xpText: { fontWeight: "900", color: "#6B5200" },
});
