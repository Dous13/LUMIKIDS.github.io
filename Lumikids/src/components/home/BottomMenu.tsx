import React from "react";
import CoinIcon from "../common/CoinIcon";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

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
          <Text style={styles.stat}> {coins}</Text>
        </View>

        <Text style={styles.stat}>
          🔥 {streak}
        </Text>

      </View>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.xpText}>
        {xp} XP
      </Text>

    </View>

    <View style={styles.buttons}>

      <TouchableOpacity
        style={styles.dashboardButton}
        onPress={onDashboardPress}
      >
        <Text style={styles.buttonEmoji}>
          📊
        </Text>

        <Text style={styles.buttonText}>
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shopButton}
        onPress={onShopPress}
      >
        <Text style={styles.buttonEmoji}>
          🛒
        </Text>

        <Text style={styles.buttonText}>
          Shop
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onParentPress}
      >
        <Text style={styles.buttonEmoji}>
          🚪
        </Text>

        <Text style={styles.buttonText}>
          Logout
        </Text>
      </TouchableOpacity>

    </View>

  </View>
);
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 10,
  },

  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  statWithIcon: { flexDirection: "row", alignItems: "center" },

  stat: {
    fontSize: 18,
    fontWeight: "800",
    color: "#334155",
  },

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

  xpText: {
    marginTop: 10,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: "#475569",
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  dashboardButton: {
    flex: 1,
    marginRight: 6,
    backgroundColor: "#EEF4FF",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },

  shopButton: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: "#FFF4CC",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },

  logoutButton: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: "#EAF7FF",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },

  buttonEmoji: {
    fontSize: 24,
  },

  buttonText: {
    marginTop: 4,
    fontWeight: "700",
    fontSize: 15,
    color: "#334155",
  },
});