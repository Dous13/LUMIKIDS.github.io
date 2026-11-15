import TouchableOpacity from "../common/MotionTouchable";
import React from "react";
import CoinIcon from "../common/CoinIcon";
import { Ionicons } from "@expo/vector-icons";
import AnimatedProgress from "../common/AnimatedProgress";
import CelebrationText from "../common/CelebrationText";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  xp: number;
  coins: number;
  level: number;
  progress: number;
  streak: number;

  onShopPress: () => void;
  onDashboardPress: () => void;
  onParentPress: () => void;
};

export default function BottomMenu({
  xp,
  coins,
  level,
  progress,
  streak,
  onShopPress,
  onDashboardPress,
  onParentPress,
}: Props) {

return (
  <View style={styles.container}>

    <View style={styles.statsCard}>

      <View style={styles.row}>

        <Text style={styles.stat}>
          ⭐ Lv.{level}
        </Text>

        <View style={styles.statWithIcon}>
          <CoinIcon size={20} />
          <CelebrationText key={coins} style={styles.stat}> {coins}</CelebrationText>
        </View>

        <Text style={styles.stat}>
          🔥 {streak}
        </Text>

      </View>

      <AnimatedProgress value={progress} />

      <Text style={styles.xpText}>
        {xp} XP
      </Text>

    </View>

    <View style={styles.buttons}>

      <TouchableOpacity
        style={styles.dashboardButton}
        onPress={onDashboardPress}
      >
        <Ionicons name="bar-chart-outline" size={22} color="#2867AD" />

        <Text style={styles.buttonText}>
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shopButton}
        onPress={onShopPress}
      >
        <Ionicons name="bag-handle-outline" size={22} color="#2867AD" />

        <Text style={styles.buttonText}>
          Shop
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onParentPress}
      >
        <Ionicons name="log-out-outline" size={22} color="#5D7080" />

        <Text style={styles.buttonText}>
          Logout
        </Text>
      </TouchableOpacity>

    </View>

  </View>
);
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 8, width: "100%", maxWidth: 720, alignSelf: "center", backgroundColor: "#FAF8F2" },

  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 12, elevation: 0, shadowColor: "#000", shadowOpacity: 0, shadowRadius: 6, shadowOffset: {
      width: 0,
      height: 3,
    }, borderWidth: 1, borderColor: "#E1E7E5" },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },

  statWithIcon: { flexDirection: "row", alignItems: "center" },

  stat: { fontSize: 15, fontWeight: "700", color: "#23394A" },

  progressBackground: {
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4ADE80",
    borderRadius: 999,
  },

  xpText: { marginTop: 6, textAlign: "center", fontWeight: "700", fontSize: 12, color: "#5D7080" },

  buttons: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },

  dashboardButton: { flex: 1, marginRight: 6, backgroundColor: "transparent", borderRadius: 12, paddingVertical: 10, alignItems: "center" },

  shopButton: { flex: 1, marginHorizontal: 3, backgroundColor: "transparent", borderRadius: 12, paddingVertical: 10, alignItems: "center" },

  logoutButton: { flex: 1, marginLeft: 6, backgroundColor: "transparent", borderRadius: 12, paddingVertical: 10, alignItems: "center" },

  buttonEmoji: { fontSize: 21 },

  buttonText: { marginTop: 4, fontWeight: "700", fontSize: 12, color: "#5D7080" },
});
