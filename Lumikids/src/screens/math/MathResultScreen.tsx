import React from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { RootStackParamList } from "../../types/navigation";

type Route = RouteProp<RootStackParamList, "MathResult">;

export default function MathResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();

  const {
    lessonId,
    score,
    total,
    xp,
    coins,
    stars,
    unlocked,
  } = route.params;

  const percentage = Math.round((score / total) * 100);

  let message = "Great effort! 🌟";

  if (stars === 3) {
    message = "Amazing! You mastered this lesson! 🎉";
  } else if (stars === 2) {
    message = "Awesome work! Keep it up! 😊";
  } else if (stars === 1) {
    message = "You passed! Let's keep learning! 💪";
  }

  return (
    <LinearGradient
      colors={["#FFFDE7", "#E8F8FF", "#DFF7E8"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.celebrate}>🎉</Text>

          <Text style={styles.title}>
            Math Lesson Complete!
          </Text>

          <Text style={styles.subtitle}>
            You finished lesson {lessonId}
          </Text>

          <Text style={styles.stars}>
            {"⭐".repeat(stars)}
          </Text>

          <Text style={styles.score}>
            {score} / {total}
          </Text>

          <Text style={styles.percentage}>
            {percentage}%
          </Text>

          <Text style={styles.message}>
            {message}
          </Text>

          <View style={styles.rewardRow}>
            <View style={styles.rewardCard}>
              <Text style={styles.rewardEmoji}>✨</Text>
              <Text style={styles.rewardValue}>+{xp}</Text>
              <Text style={styles.rewardLabel}>XP</Text>
            </View>

            <View style={styles.rewardCard}>
              <Text style={styles.rewardEmoji}>🪙</Text>
              <Text style={styles.rewardValue}>+{coins}</Text>
              <Text style={styles.rewardLabel}>Coins</Text>
            </View>
          </View>

          <Text style={styles.unlock}>
            {unlocked
              ? "🔓 New Math Lesson Unlocked!"
              : "🏆 You finished all Math lessons!"}
          </Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.88}
            onPress={() => navigation.replace("Math")}
          >
            <Text style={styles.buttonText}>
              Continue →
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    padding: 28,
    alignItems: "center",
    elevation: 7,
  },

  celebrate: {
    fontSize: 65,
  },

  title: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: "900",
    color: "#2563EB",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 17,
    fontWeight: "600",
  },

  stars: {
    minHeight: 64,
    marginTop: 22,
    fontSize: 48,
  },

  score: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: "900",
    color: "#334155",
  },

  percentage: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "800",
    color: "#4A90E2",
  },

  message: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 19,
    lineHeight: 27,
    color: "#475569",
    fontWeight: "700",
  },

  rewardRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 22,
  },

  rewardCard: {
    minWidth: 105,
    backgroundColor: "#F8FCFF",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2F2FF",
  },

  rewardEmoji: {
    fontSize: 28,
  },

  rewardValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "900",
    color: "#334155",
  },

  rewardLabel: {
    marginTop: 1,
    color: "#64748B",
    fontWeight: "800",
  },

  unlock: {
    marginTop: 22,
    textAlign: "center",
    color: "#16A34A",
    fontWeight: "800",
    fontSize: 17,
  },

  button: {
    width: "100%",
    marginTop: 26,
    backgroundColor: "#4DA8FF",
    borderRadius: 23,
    paddingVertical: 17,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },
});
