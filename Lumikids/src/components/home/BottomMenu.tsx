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
        <Ionicons name="bar-chart-outline" size={22} color="#176BC1" />

        <Text style={styles.buttonText}>
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shopButton}
        onPress={onShopPress}
      >
        <Ionicons name="bag-handle-outline" size={22} color="#176BC1" />

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
  container: { paddingHorizontal: 24, paddingBottom: 8, paddingTop: 10, width: "100%", maxWidth: 720, alignSelf: "center", backgroundColor: "#EAF7FF", borderTopWidth: 1, borderColor: "#C5E0F2", borderTopLeftRadius: 22, borderTopRightRadius: 22 },

  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 12, elevation: 2, shadowColor: "#276891", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: {"width":0,"height":2}, borderWidth: 1, borderColor: "#C8E2F5", borderBottomWidth: 3 },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },

  statWithIcon: { flexDirection: "row", alignItems: "center", minHeight: 24, backgroundColor: "#FFF0BA", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },

  stat: { fontSize: 16, fontWeight: "700", color: "#23394A", lineHeight: 22 },

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

  xpText: { marginTop: 5, textAlign: "center", fontWeight: "700", fontSize: 13, color: "#5D7080", lineHeight: 18 },

  buttons: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, alignItems: "stretch" },

  dashboardButton: { flex: 1, marginRight: 6, backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", minHeight: 60, borderWidth: 1, borderColor: "#CEE3F2", borderBottomWidth: 2 },

  shopButton: { flex: 1, marginHorizontal: 3, backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", minHeight: 60, borderWidth: 1, borderColor: "#CEE3F2", borderBottomWidth: 2 },

  logoutButton: { flex: 1, marginLeft: 6, backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", minHeight: 60, borderWidth: 1, borderColor: "#CEE3F2", borderBottomWidth: 2 },

  buttonEmoji: { fontSize: 21 },

  buttonText: { marginTop: 4, fontWeight: "700", fontSize: 13, color: "#5D7080", lineHeight: 18 },
});
