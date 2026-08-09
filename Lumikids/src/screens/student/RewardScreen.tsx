import React from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import {
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";

import { RootStackParamList } from "../../types/navigation";

type RewardRouteProp = RouteProp<
  RootStackParamList,
  "Reward"
>;

export default function RewardScreen() {

  const navigation = useNavigation<any>();

  const route = useRoute<RewardRouteProp>();

  const {
    subject,
    lessonId,
    xp,
    coins,
    stars,
    unlocked,
    levelUp,
  } = route.params;

  return (
    <LinearGradient
      colors={["#FFFDE7", "#E8F8FF"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>

        <Text style={styles.title}>
          🎉 Lesson Complete!
        </Text>

        <Text style={styles.lesson}>
          Letter {lessonId}
        </Text>

        <Text style={styles.stars}>
          {"⭐".repeat(stars)}
        </Text>

        <Text style={styles.reward}>
          ✨ +{xp} XP
        </Text>

        <Text style={styles.reward}>
          🪙 +{coins} Coins
        </Text>

        <Text style={styles.unlock}>
          {unlocked
            ? "🔓 New Lesson Unlocked!"
            : "🎉 Great Job!"}
        </Text>

        {levelUp && (
          <Text style={styles.levelUp}>
            ⬆ LEVEL UP!
          </Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
          switch (subject) {
            case "reading":
              navigation.replace("Reading");
              break;

            case "writing":
              navigation.replace("Writing");
              break;

            case "math":
              navigation.replace("Math");
              break;
          }
        }}
        >
          <Text style={styles.buttonText}>
            Continue →
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#2563EB",
  },

  lesson: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "700",
    color: "#475569",
  },

  stars: {
    fontSize: 60,
    marginVertical: 30,
  },

  reward: {
    fontSize: 28,
    fontWeight: "700",
    marginVertical: 10,
  },

  unlock: {
    marginTop: 25,
    fontSize: 22,
    color: "#16A34A",
    fontWeight: "700",
    textAlign: "center",
  },

  levelUp: {
    marginTop: 15,
    fontSize: 28,
    color: "#F59E0B",
    fontWeight: "900",
  },

  button: {
    marginTop: 40,
    backgroundColor: "#4DA8FF",
    paddingHorizontal: 45,
    paddingVertical: 18,
    borderRadius: 20,
  },

  buttonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },

});