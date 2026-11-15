import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useReducedMotion } from "../../hooks/useReducedMotion";

import { LinearGradient } from "expo-linear-gradient";
import { mascotShop } from "../../data/mascotShop";

type Props = {
  avatar?: string;
};

export default function MascotCard({ avatar = "default" }: Props) {
  const reduce = useReducedMotion();
  const focused = useIsFocused();
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce !== false || !focused) { float.setValue(0); return; }
    const idle = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -3, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    idle.start();
    return () => { idle.stop(); float.setValue(0); };
  }, [reduce, focused, float]);
  const mascot =
    mascotShop.find(item => item.id === avatar) ??
    mascotShop.find(item => item.id === "default");
  return (
    <LinearGradient
      colors={["#EDF4F5", "#EDF4F5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Clouds */}

      <View style={styles.cloud1} />
      <View style={styles.cloud2} />

      <Animated.Image
        source={mascot?.image ?? require("../../../assets/images/mascot.png")}
        style={[styles.mascot, { transform: [{ translateY: float }] }]}
        resizeMode="contain"
      />

      <View style={styles.speechBubble}>
        <Text style={styles.greeting}>
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
  card: { marginTop: 16, marginBottom: 22, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 20, alignItems: "center", overflow: "hidden", shadowColor: "#6BBEFF", shadowOpacity: 0, shadowRadius: 18, elevation: 0, backgroundColor: "#EDF4F5" },

  mascot: { width: 132, height: 132, marginBottom: 4 },

  speechBubble: { width: "100%", backgroundColor: "transparent", borderRadius: 0, padding: 10, alignItems: "center" },

  greeting: { fontSize: 24, fontWeight: "800", color: "#23394A" },

  message: { marginTop: 6, textAlign: "center", fontSize: 16, lineHeight: 23, color: "#5D7080" },

  goal: { marginTop: 14, backgroundColor: "#FFF2CD", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },

  goalText: { fontWeight: "700", color: "#805B15", fontSize: 14 },

  cloud1: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255, 255, 255, 0.36)", top: -40, right: -20, display: "none" },

  cloud2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255, 255, 255, 0.36)", left: -15, bottom: 40, display: "none" },
});
