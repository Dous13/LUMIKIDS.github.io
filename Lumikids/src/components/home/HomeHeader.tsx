import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

type Props = {
  coins?: number;
  streak?: number;
  onParentPress?: () => void;
};

export default function HomeHeader({
  coins = 120,
  streak = 5,
  onParentPress,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.parentButton}
        activeOpacity={0.8}
        onPress={onParentPress}
      >
        <Text style={styles.parentIcon}>👤</Text>

        <Text style={styles.parentText}>
          Parent
        </Text>
      </TouchableOpacity>

      <View style={styles.right}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            🪙 {coins}
          </Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            🔥 {streak}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  parentButton: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 18,

    shadowColor: "#4DA8FF",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  parentIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  parentText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },

  right: {
    flexDirection: "row",
  },

  badge: {
    marginLeft: 10,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 18,

    shadowColor: "#4DA8FF",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  badgeText: {
    fontWeight: "700",
    color: "#334155",
  },
});