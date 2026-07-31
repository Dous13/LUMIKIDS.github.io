import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { readingLessons } from "../../data/readingLessons";
import {
  getLessonProgress,
  getAllProgress,
} from "../../services/database/localProgress";
import { useFocusEffect } from "@react-navigation/native";
import { getSession } from "../../services/session/session";


export default function ReadingScreen() {
  const navigation = useNavigation<any>();
  const [studentId, setStudentId] =
    useState("");

  const [progress, setProgress] =
    useState<any[]>([]);
  const loadProgress = async () => {
  const session = await getSession();

  if (!session) return;

  setStudentId(session.studentId);

  const data =
    getAllProgress(session.studentId);

  setProgress(data as any[]);
  };

  useEffect(() => {
  loadProgress();
  }, []);

  useFocusEffect(
  useCallback(() => {
    loadProgress();
  }, [])
  );

  const completedLessons = progress.filter(
    (lesson: any) => lesson.completed === 1
  ).length;

  const progressPercentage =
    (completedLessons / readingLessons.length) * 100;

  const progressMap = Object.fromEntries(
    progress.map((p: any) => [p.lessonId, p])
  );
  return (
    <LinearGradient
      colors={["#F8FCFF", "#EAF8FF", "#D8F4FF"]}
      style={styles.container}
    >
    <SafeAreaView style={{ flex: 1 }}>


      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.popToTop()}
      >
        <Ionicons
          name="arrow-back"
          size={28}
          color="#618ff1"
        />

        <Text style={styles.backText}>
          Home
        </Text>
      </TouchableOpacity>

      <View style={styles.heroCard}>

        <Text style={styles.owl}>
          🦉
        </Text>

        <Text style={styles.heroTitle}>
          Reading Adventure
        </Text>

        <Text style={styles.heroSubtitle}>
          Let's discover new letters today!
        </Text>

      </View>

        <Text style={styles.subtitle}>
          🦉 Let's learn a new letter!
        </Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            ⭐ Reading Progress
          </Text>

          <Text style={styles.progressText}>
            {completedLessons} of {readingLessons.length} Letters Completed
          </Text>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>
        </View>

        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          data={readingLessons}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!progressMap[item.id]?.unlocked}
              style={[
                styles.lessonCard,
                {
                  backgroundColor: item.color,
                  opacity: progressMap[item.id]?.unlocked ? 1 : 0.55,
                },
              ]}
              onPress={() =>
                navigation.navigate("Lesson", {
                  lessonId: item.id,
                })
              }
            >

              <Text style={styles.lessonEmoji}>
                {item.emoji}
              </Text>

              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>
                  {item.letter}
                </Text>

                <Text style={styles.lessonWord}>
                  {item.word}
                </Text>

                <Text style={styles.reward}>
                  ⭐ +{item.xp} XP
                </Text>

                {progressMap[item.id]?.unlocked ? (
                  <View style={styles.startButton}>
                    <Text style={styles.startText}>
                      ▶ PLAY
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.locked}>
                    🔒Finish the previous letter first!
                  </Text>
                )}

              </View>

            </TouchableOpacity>

          )}
        />

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1E3A8A",
    textAlign: "center",
    marginTop: 20,
  },

  subtitle: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 18,
    marginTop: 10,
  },

  progressCard: {
    marginHorizontal: 20,
    marginTop: 25,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 20,

    elevation: 4,
  },

  progressTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },

  progressText: {
    marginTop: 8,
    color: "#64748B",
  },

  progressBackground: {
    marginTop: 16,
    height: 12,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    width: "20%",
    height: "100%",
    backgroundColor: "#57C36A",
    borderRadius: 20,
  },

  lessonCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,

    flexDirection: "row",
    alignItems: "center",

    elevation: 5,
  },

  lessonEmoji: {
    fontSize: 60,
    marginRight: 22,
  },

  lessonTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },

  lessonWord: {
    marginTop: 6,
    fontSize: 18,
    color: "#475569",
  },

  startButton: {
    marginTop: 16,
    alignSelf: "flex-start",

    backgroundColor: "#4DA8FF",

    paddingHorizontal: 22,
    paddingVertical: 10,

    borderRadius: 16,
  },

  startText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  locked: {
    marginTop: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  backButton: {
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "white",
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderRadius: 30,
  marginBottom: 5,
  elevation: 4,
  marginLeft: 15,
  },

  backText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },

  heroCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 28,
    alignItems: "center",

    elevation: 6,
  },

  owl: {
    fontSize: 70,
  },

  heroTitle: {
    marginTop: 10,
    fontSize: 30,
    fontWeight: "900",
    color: "#2563EB",
  },

  heroSubtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 18,
    color: "#64748B",
  },

  reward: {
  marginTop: 10,
  color: "#F59E0B",
  fontWeight: "800",
  fontSize: 18,
  },

});