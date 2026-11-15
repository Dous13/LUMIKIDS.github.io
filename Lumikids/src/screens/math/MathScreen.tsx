import AnimatedProgress from "../../components/common/AnimatedProgress";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import { mathLessons } from "../../data/mathLessons";
import { getSession } from "../../services/session/session";
import { getAllMathProgress } from "../../services/database/localMath";

export default function MathScreen() {
  const navigation = useNavigation<any>();

  const [progress, setProgress] = useState<any[]>([]);

  /**
   * Normalize lesson IDs so values such as:
   *
   * 2
   * "2"
   * "2.0"
   *
   * are all treated as the same lesson ID.
   */
  const normalizeLessonId = (
    id: string | number
  ): string => {
    return String(Number(id));
  };

  /**
   * Load the student's latest math progress.
   *
   * This runs whenever the Math screen receives focus,
   * so returning from a completed quiz immediately
   * refreshes the unlocked/completed lesson states.
   */
  const load = useCallback(async () => {
    const session = await getSession();

    if (!session) {
      return;
    }

    const mathProgress = getAllMathProgress(
      session.studentId
    );

    console.log(
      "MATH LESSON DATA:",
      mathLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
      }))
    );

    console.log(
      "MATH PROGRESS DATA:",
      mathProgress.map((item) => ({
        lessonId: item.lessonId,
        unlocked: item.unlocked,
        completed: item.completed,
      }))
    );

    setProgress(mathProgress);
  }, []);

  /**
   * Refresh progress whenever the screen becomes active.
   */
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /**
   * Convert the progress array into a lookup object.
   *
   * Example:
   *
   * {
   *   "1": { ... },
   *   "2": { ... }
   * }
   */
  const progressMap = Object.fromEntries(
    progress.map((item) => [
      normalizeLessonId(item.lessonId),
      item,
    ])
  );

  /**
   * Calculate overall math completion.
   */
  const completedLessons = progress.filter(
    (item) => item.completed === 1
  ).length;

  const progressPercent = mathLessons.length
    ? (completedLessons / mathLessons.length) * 100
    : 0;

  return (
    <LinearGradient
      colors={["#EAF7FF", "#EAF7FF"]}
      style={styles.container}
    >
      {/* Decorative background */}
      <View style={styles.circleOne} />
      <View style={styles.circleTwo} />

      <View style={styles.star}>
        <Text>⭐</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={mathLessons}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="arrow-back"
                  size={22}
                  color="#176BC1"
                />

                <Text style={styles.backText}>
                  Home
                </Text>
              </TouchableOpacity>

              {/* Hero Card */}
              <FadeIn style={styles.hero}>
                <View style={styles.decorLeft}>
                  <Text>☁️</Text>
                </View>

                <View style={styles.decorRight}>
                  <Text>➕</Text>
                </View>

                <Text style={styles.heroEmoji}>
                  🔢
                </Text>

                <Text style={styles.kicker}>
                  MATH ADVENTURE
                </Text>

                <Text style={styles.title}>
                  Let's Count & Discover! 🚀
                </Text>

                <Text style={styles.subtitle}>
                  Count, compare, and solve playful
                  challenges as you level up.
                </Text>

                {/* Progress Summary */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    🏆 {completedLessons}/
                    {mathLessons.length} lessons
                  </Text>

                  <Text style={styles.percent}>
                    {Math.round(progressPercent)}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <AnimatedProgress value={progressPercent} color="#FFCD54" style={styles.track} />
              </FadeIn>

              {/* Section Header */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>
                  Choose a challenge
                </Text>

                <Text style={styles.sectionEmoji}>
                  🧮
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            /**
             * Normalize the current lesson's ID before
             * looking it up in SQLite progress.
             */
            const lessonKey = normalizeLessonId(
              item.id
            );

            const lessonProgress =
              progressMap[lessonKey];

            /**
             * The first lesson is always available.
             *
             * Every following lesson depends on the
             * unlocked value stored in local SQLite.
             */
            const unlocked =
              lessonProgress?.unlocked === 1 ||
              index === 0;

            /**
             * Determine whether this lesson has
             * already been completed.
             */
            const completed =
              lessonProgress?.completed === 1;

            return (
              <TouchableOpacity
                disabled={!unlocked}
                activeOpacity={0.88}
                style={[
                  styles.lesson,
                  !unlocked && styles.locked,
                ]}
                onPress={() =>
                  navigation.navigate(
                    "MathLesson",
                    {
                      lessonId: item.id,
                    }
                  )
                }
              >
                {/* Lesson Icon */}
                <View style={styles.lessonIcon}>
                  <Text style={styles.lessonEmoji}>
                    {item.emoji}
                  </Text>
                </View>

                {/* Lesson Information */}
                <View style={styles.lessonBody}>
                  <Text style={styles.lessonTitle}>
                    {item.title}
                  </Text>

                  <Text
                    style={styles.lessonDescription}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>

                  {/* XP Reward */}
                  <View style={styles.xpPill}>
                    <Text style={styles.lessonMeta}>
                      ⭐ {item.xpReward} XP
                    </Text>
                  </View>
                </View>

                {/* Lesson Status */}
                <View
                  style={[
                    styles.status,
                    {
                      backgroundColor: completed
                        ? "#DDF8E5"
                        : unlocked
                        ? "#E8F3FF"
                        : "#EEF2F7",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {completed
                      ? "✓"
                      : unlocked
                      ? "›"
                      : "🔒"}
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
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  content: { paddingHorizontal: 20, paddingBottom: 38, width: "100%", maxWidth: 720, alignSelf: "center", paddingTop: 10 },

  /* Decorative Background */

  circleOne: { position: "absolute", width: 270, height: 270, borderRadius: 135, backgroundColor: "rgba(255,255,255,.17)", top: -105, right: -90, display: "none" },

  circleTwo: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,.18)", bottom: 70, left: -55, display: "none" },

  star: { position: "absolute", top: 150, right: 18, display: "none" },

  /* Back Button */

  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "transparent", borderRadius: 22, paddingHorizontal: 0, paddingVertical: 9, elevation: 0, marginTop: 6, minHeight: 44 },

  backText: {
    marginLeft: 7,
    color: "#176BC1",
    fontSize: 16,
    fontWeight: "900",
  },

  /* Hero */

  hero: { marginTop: 14, borderRadius: 24, padding: 24, backgroundColor: "#007C70", alignItems: "center", overflow: "hidden", elevation: 0 },

  decorLeft: { position: "absolute", left: 12, top: 18, display: "none" },

  decorRight: { position: "absolute", right: 14, top: 18, display: "none" },

  heroEmoji: { fontSize: 44 },

  kicker: { marginTop: 8, fontSize: 11, fontWeight: "900", letterSpacing: 1.8, color: "#FFFFFF" },

  title: { marginTop: 8, fontSize: 27, fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: 34 },

  subtitle: { marginTop: 7, fontSize: 16, lineHeight: 24, color: "#FFFFFF", textAlign: "center" },

  /* Progress */

  progressRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  progressLabel: { fontWeight: "900", color: "#FFFFFF" },

  percent: { fontWeight: "900", color: "#FFFFFF" },

  track: { width: "100%", height: 11, backgroundColor: "rgba(255,255,255,0.26)", borderRadius: 20, overflow: "hidden", marginTop: 8 },

  fill: {
    height: "100%",
    backgroundColor: "#58C977",
    borderRadius: 20,
  },

  /* Section Header */

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 3,
  },

  sectionTitle: { fontSize: 21, fontWeight: "800", color: "#23394A", textShadowColor: "rgba(0,0,0,.14)", textShadowRadius: 0 },

  sectionEmoji: { fontSize: 28, display: "none" },

  /* Lesson Card */

  lesson: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", elevation: 1, borderWidth: 1, borderColor: "#8CD3BF", borderLeftWidth: 4 },

  locked: { opacity: 0.6 },

  lessonIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#FFF2BE", justifyContent: "center", alignItems: "center" },

  lessonEmoji: { fontSize: 34, textAlign: "center", textAlignVertical: "center", includeFontPadding: false },

  lessonBody: { flex: 1, marginLeft: 13, marginRight: 8, minWidth: 0 },

  lessonTitle: { fontSize: 20, fontWeight: "800", color: "#007C70" },

  lessonDescription: {
    fontSize: 14,
    lineHeight: 19,
    color: "#64748B",
    marginTop: 2,
  },

  /* XP */

  xpPill: { alignSelf: "flex-start", backgroundColor: "#FFE49B", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5 },

  lessonMeta: { fontSize: 12, fontWeight: "900", color: "#6D4C07" },

  /* Status */

  status: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },

  statusText: { fontSize: 21, fontWeight: "900", color: "#007C70", textAlign: "center", textAlignVertical: "center", includeFontPadding: false },
});