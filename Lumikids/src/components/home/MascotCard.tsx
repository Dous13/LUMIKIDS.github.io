import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { mascotShop } from "../../data/mascotShop";

type Props = {
  avatar?: string;
};

export default function MascotCard({ avatar = "default" }: Props) {
  const mascot =
    mascotShop.find(item => item.id === avatar) ??
    mascotShop.find(item => item.id === "default");
  return (
    <LinearGradient
      colors={["#5AAEFF", "#7BC5FF", "#A9DDFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Clouds */}

      <View style={styles.cloud1} />
      <View style={styles.cloud2} />

      <Image
        source={mascot?.image ?? require("../../../assets/images/mascot.png")}
        style={styles.mascot}
        resizeMode="contain"
      />

      <View style={styles.speechBubble}>
        <Text style={styles.greeting}>
          👋 Hi Explorer!
        </Text>

        <Text style={styles.message}>
          Let's have a fun learning adventure today!
        </Text>

        <View style={styles.goal}>
          <Text style={styles.goalText}>
            ⭐ Today's Goal: Earn 30 XP
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    marginBottom: 28,

    borderRadius: 36,

    paddingVertical: 30,
    paddingHorizontal: 20,

    alignItems: "center",

    overflow: "hidden",

    shadowColor: "#6BBEFF",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },

  mascot: {
    width: 165,
    height: 165,
    marginBottom: 16,
  },

  speechBubble: {
    width: "100%",

    backgroundColor: "white",

    borderRadius: 26,

    padding: 20,

    alignItems: "center",
  },

  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2563EB",
  },

  message: {
    marginTop: 10,

    textAlign: "center",

    fontSize: 17,

    lineHeight: 24,

    color: "#64748B",
  },

  goal: {
    marginTop: 18,

    backgroundColor: "#FFF7D6",

    paddingHorizontal: 20,

    paddingVertical: 12,

    borderRadius: 30,
  },

  goalText: {
    fontWeight: "700",

    color: "#B7791F",

    fontSize: 16,
  },

  cloud1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.36)",
    top: -40,

    right: -20,
  },

  cloud2: {
    position: "absolute",

    width: 80,
    height: 80,

    borderRadius: 40,

    backgroundColor: "rgba(255, 255, 255, 0.36)",

    left: -15,

    bottom: 40,
  },
});