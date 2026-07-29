import { View, Text, StyleSheet } from "react-native";

export default function XPCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.level}>
        ⭐ Level 2 Explorer
      </Text>

      <View style={styles.progressBackground}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.xp}>
        120 / 150 XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#57A8FF",
    marginHorizontal: 24,
    borderRadius: 28,
    padding: 22,
  },

  level: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },

  progressBackground: {
    marginTop: 18,
    height: 14,
    backgroundColor: "#91C8FF",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    width: "80%",
    backgroundColor: "#FFD54F",
    height: "100%",
  },

  xp: {
    marginTop: 12,
    color: "white",
    fontWeight: "700",
  },
});