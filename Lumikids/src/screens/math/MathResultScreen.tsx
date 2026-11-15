import CelebrationText from "../../components/common/CelebrationText";
import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React from "react";
import { BackHandler } from "react-native";
import { Text, StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

import { RootStackParamList } from "../../types/navigation";
import { mathLessons } from "../../data/mathLessons";
import { getSession } from "../../services/session/session";
import { isMathLessonUnlocked } from "../../services/database/localMath";
import CoinIcon from "../../components/common/CoinIcon";

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
  } = route.params;

  const [unlocked, setUnlocked] = React.useState(false);

  const goToMath = React.useCallback(() => {
    navigation.reset({
      index: 1,
      routes: [
        { name: "Home" },
        { name: "Math" },
      ],
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          goToMath();
          return true;
        }
      );

      return () => subscription.remove();
    }, [goToMath])
  );

  React.useEffect(() => {
    let active = true;

    async function checkProgress() {
      try {
        const session = await getSession();

        if (!session) {
          if (active) setUnlocked(false);
          return;
        }

        const currentIndex = mathLessons.findIndex(
          lesson => lesson.id === lessonId
        );

        const nextLesson =
          currentIndex >= 0
            ? mathLessons[currentIndex + 1]
            : undefined;

        const nextIsUnlocked = nextLesson
          ? isMathLessonUnlocked(
              session.studentId,
              nextLesson.id
            )
          : false;

        if (active) {
          setUnlocked(nextIsUnlocked);
        }
      } catch (error) {
        console.error(
          "[MathResult] Could not verify lesson progression:",
          error
        );

        if (active) setUnlocked(false);
      }
    }

    checkProgress();

    return () => {
      active = false;
    };
  }, [lessonId]);

  const percentage =
    total > 0
      ? Math.round((score / total) * 100)
      : 0;

  let message = "Great effort! 🌟";

  if (stars === 3) {
    message = "Amazing! You mastered this lesson! 🎉";
  } else if (stars === 2) {
    message = "Awesome work! Keep it up! 😊";
  } else if (stars === 1) {
    message = "You passed! Let's keep learning! 💪";
  }

  const currentIndex = mathLessons.findIndex(
    lesson => lesson.id === lessonId
  );

  const isFinalLesson =
    currentIndex >= 0 &&
    currentIndex === mathLessons.length - 1;

  return (
    <LinearGradient
      colors={["#EAF7FF", "#EAF7FF"]}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FadeIn style={styles.card}>
            <Text style={styles.celebrate}>🎉</Text>

            <Text style={styles.title}>
              Math Lesson Complete!
            </Text>

            <Text style={styles.subtitle}>
              You finished lesson {lessonId}
            </Text>

            <CelebrationText style={styles.stars}>
              {"⭐".repeat(Math.max(0, Math.min(3, stars)))}
            </CelebrationText>

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
                <CelebrationText style={styles.rewardValue}>
                  +{xp}
                </CelebrationText>
                <Text style={styles.rewardLabel}>
                  XP
                </Text>
              </View>

              <View style={styles.rewardCard}>
                <CoinIcon size={28} />
                <CelebrationText style={styles.rewardValue}>
                  +{coins}
                </CelebrationText>
                <Text style={styles.rewardLabel}>
                  Coins
                </Text>
              </View>
            </View>

            <Text style={styles.unlock}>
              {unlocked
                ? "🔓 New Math Lesson Unlocked!"
                : isFinalLesson
                  ? "🏆 You finished all Math lessons!"
                  : "📚 Your progress has been saved!"}
            </Text>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.88}
              onPress={goToMath}
            >
              <Text style={styles.buttonText}>
                Continue →
              </Text>
            </TouchableOpacity>
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20, width: "100%", maxWidth: 620, alignSelf: "center" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, alignItems: "center", elevation: 1, borderWidth: 1, borderColor: "#8CD3BF" },
  celebrate: { fontSize: 48 },
  title: { marginTop: 8, fontSize: 28, fontWeight: "900", color: "#007C70", textAlign: "center", lineHeight: 36 },
  subtitle: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
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
  rewardCard: { minWidth: 96, backgroundColor: "#D9F2E8", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center", borderWidth: 0, borderColor: "#E2F2FF" },
  rewardEmoji: {
    fontSize: 28,
  },
  rewardValue: { marginTop: 4, fontSize: 22, fontWeight: "900", color: "#23394A" },
  rewardLabel: {
    marginTop: 1,
    color: "#64748B",
    fontWeight: "800",
  },
  unlock: { marginTop: 22, textAlign: "center", color: "#007C70", fontWeight: "800", fontSize: 17 },
  button: { width: "100%", marginTop: 26, backgroundColor: "#007C70", borderRadius: 16, paddingVertical: 17, alignItems: "center", minHeight: 52 },
  buttonText: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
});
