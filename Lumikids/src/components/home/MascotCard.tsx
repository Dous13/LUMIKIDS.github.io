import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useAmbientFloat } from "../../hooks/useAmbientFloat";

import { LinearGradient } from "expo-linear-gradient";
import { mascotShop } from "../../data/mascotShop";

type Props = {
  avatar?: string;
};

export default function MascotCard({ avatar = "default" }: Props) {
  const drift = useAmbientFloat(1800);
  const compact = useWindowDimensions().width < 480;
  const mascot =
    mascotShop.find(item => item.id === avatar) ??
    mascotShop.find(item => item.id === "default");
  return (
    <LinearGradient
      colors={["#D9F0FF", "#D9F0FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact && styles.compactCard]}
    >
      {/* Clouds */}

      <View style={styles.cloud1} />
      <View style={styles.cloud2} />

      <Animated.Image
        source={mascot?.image ?? require("../../../assets/images/mascot.png")}
        style={[styles.mascot, compact && styles.compactMascot, { transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }]}
        resizeMode="contain"
      />

      <View style={styles.speechBubble}>
        <Text style={[styles.greeting, compact && styles.compactGreeting]}>
          Hi, explorer!
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
  compactCard: { paddingHorizontal: 14, paddingVertical: 14 },
  compactMascot: { width: 76, height: 96, marginRight: 12 },
  compactGreeting: { fontSize: 20, lineHeight: 26 },
  card: { marginTop: 12, marginBottom: 18, borderRadius: 24, paddingVertical: 18, paddingHorizontal: 20, alignItems: "center", overflow: "hidden", shadowColor: "#276891", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, backgroundColor: "#D9F0FF", borderWidth: 1, borderColor: "#AED5EC", flexDirection: "row", borderBottomWidth: 3 },

  mascot: { width: 104, height: 116, marginBottom: 0, marginRight: 16 },

  speechBubble: { width: "auto", backgroundColor: "transparent", borderRadius: 0, padding: 0, alignItems: "flex-start", flex: 1, minWidth: 0 },

  greeting: { fontSize: 23, fontWeight: "800", color: "#23394A", lineHeight: 29 },

  message: { marginTop: 4, textAlign: "left", fontSize: 14, lineHeight: 21, color: "#435E73" },

  goal: { marginTop: 10, backgroundColor: "#FFD66B", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, alignSelf: "flex-start" },

  goalText: { fontWeight: "700", color: "#65480A", fontSize: 12, lineHeight: 18 },

  cloud1: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255, 255, 255, 0.36)", top: -40, right: -20, display: "none" },

  cloud2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255, 255, 255, 0.36)", left: -15, bottom: 40, display: "none" },
});
