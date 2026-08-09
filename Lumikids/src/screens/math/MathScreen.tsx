import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { mathLessons } from "../../data/mathLessons";
import {
  getAllMathProgress,
  initializeMathProgress,
} from "../../services/database/localMath";
import { getSession } from "../../services/session/session";

export default function MathScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<any[]>([]);

  const loadProgress = useCallback(async () => {
    const session = await getSession();
    if (!session) return;

    initializeMathProgress(session.studentId);
    setProgress(getAllMathProgress(session.studentId));
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const progressMap = Object.fromEntries(
    progress.map(item => [item.lessonId, item])
  );

  const completedLessons = progress.filter(
    item => item.completed === 1
  ).length;

  const percentage =
    mathLessons.length > 0
      ? (completedLessons / mathLessons.length) * 100
      : 0;

  return (
    <LinearGradient
      colors={["#F8FCFF", "#EAF8FF", "#D6F1FF"]}
      style={styles.container}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      <View style={styles.circle4} />

      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          data={mathLessons}
          keyExtractor={item => item.id.toString()}
          ListHeaderComponent={
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backText}>← Home</Text>
              </TouchableOpacity>

              <View style={styles.headerCard}>
                <Text style={styles.headerEmoji}>🔢</Text>
                <Text style={styles.title}>Math Adventure</Text>
                <Text style={styles.subtitle}>
                  Count, add, subtract, discover shapes, and find patterns!
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>

                <Text style={styles.progressText}>
                  {completedLessons} of {mathLessons.length} lessons completed
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => {
            const itemProgress = progressMap[item.id];
            const unlocked = itemProgress?.unlocked === 1;
            const completed = itemProgress?.completed === 1;

            return (
              <TouchableOpacity
                activeOpacity={unlocked ? 0.88 : 1}
                disabled={!unlocked}
                style={[
                  styles.lessonCard,
                  !unlocked && styles.lockedCard,
                ]}
                onPress={() =>
                  navigation.navigate("MathLesson", {
                    lessonId: item.id,
                  })
                }
              >
                <View style={styles.lessonEmojiBox}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>

                <View style={styles.lessonInfo}>
                  <View style={styles.lessonTitleRow}>
                    <Text style={styles.lessonTitle}>{item.title}</Text>
                    {completed && (
                      <Text style={styles.completed}>✓</Text>
                    )}
                  </View>

                  <Text style={styles.lessonDescription}>
                    {item.description}
                  </Text>

                  <Text style={styles.reward}>
                    ⭐ +{item.xpReward} XP
                  </Text>

                  {!unlocked && (
                    <Text style={styles.lockedText}>
                      🔒 Complete the previous lesson first
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.playButton,
                    !unlocked && styles.lockedPlayButton,
                  ]}
                >
                  <Text style={styles.playText}>
                    {unlocked ? "▶" : "🔒"}
                  </Text>
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
  container: { flex: 1 },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 50,
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 30,
    marginBottom: 12,
    elevation: 4,
  },

  backText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    marginBottom: 22,
    elevation: 5,
  },

  headerEmoji: {
    fontSize: 58,
  },

  title: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: "900",
    color: "#2563EB",
  },

  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    fontSize: 16,
    lineHeight: 23,
  },

  progressTrack: {
    width: "100%",
    height: 12,
    marginTop: 18,
    backgroundColor: "#DCEEFF",
    borderRadius: 20,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#62C77A",
    borderRadius: 20,
  },

  progressText: {
    marginTop: 8,
    color: "#64748B",
    fontWeight: "700",
  },

  lessonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 17,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },

  lockedCard: {
    opacity: 0.55,
  },

  lessonEmojiBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EAF8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  emoji: {
    fontSize: 40,
  },

  lessonInfo: {
    flex: 1,
  },

  lessonTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  lessonTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#334155",
  },

  completed: {
    fontSize: 24,
    fontWeight: "900",
    color: "#57C36A",
    marginLeft: 6,
  },

  lessonDescription: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },

  reward: {
    marginTop: 8,
    color: "#F59E0B",
    fontWeight: "800",
  },

  lockedText: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#4DA8FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  lockedPlayButton: {
    backgroundColor: "#CBD5E1",
  },

  playText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  circle1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#CDEEFF",
    top: -90,
    right: -80,
  },

  circle2: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FFE8A3",
    left: -70,
    top: 330,
  },

  circle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D7F9D4",
    right: 20,
    bottom: 170,
  },

  circle4: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F8C8FF",
    left: 40,
    bottom: 60,
  },
});
