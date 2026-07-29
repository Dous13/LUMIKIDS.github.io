import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const subjects = [
  {
    emoji: "📖",
    title: "Reading",
    colors: ["#E9F8EE", "#6CCF8A"] as const,
  },
  {
    emoji: "✏️",
    title: "Writing",
    colors: ["#FFF2E3", "#FFBE73"] as const,
  },
  {
    emoji: "🔢",
    title: "Math",
    colors: ["#EAF3FF", "#79B8FF"] as const,
  },
];

export default function SubjectGrid() {
  return (
    <View style={styles.container}>
      {subjects.map((item) => (
        <TouchableOpacity
          key={item.title}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>
                {item.emoji}
              </Text>
            </View>

            <Text style={styles.title}>
              {item.title}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  card: {
    width: 102,
    height: 132,

    borderRadius: 30,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#70BFFF",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  emojiCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,

    backgroundColor: "rgba(255,255,255,0.35)",

    justifyContent: "center",
    alignItems: "center",
  },

  emoji: {
    fontSize: 34,
  },

  title: {
    marginTop: 14,
    color: "white",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.3,
  },
});