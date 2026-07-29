import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  xp: number;
  onParentPress: () => void;
};

export default function BottomMenu({
  xp,
  onParentPress,
}: Props) {
  return (
    <View style={styles.container}>

      <View style={styles.xpCard}>
        <Text style={styles.emoji}>
          ⭐
        </Text>

        <Text style={styles.text}>
          {xp} XP
        </Text>
      </View>

      <TouchableOpacity
        style={styles.parent}
        activeOpacity={0.8}
        onPress={onParentPress}
      >
        <Text style={styles.parentEmoji}>
          🚪
        </Text>

        <Text style={styles.parentText}>
          Logout
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 20,
  },

  xpCard: {

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#FFF5D6",

    paddingHorizontal: 20,

    paddingVertical: 12,

    borderRadius: 20,
  },

  emoji: {
    fontSize: 24,
  },

  text: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
  },

  parent: {

    backgroundColor: "#EAF7FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 20,
  },

  parentEmoji: {
    fontSize: 24,
  },

  parentText: {
    marginTop: 2,
    fontWeight: "700",
    color: "#334155",
  },

});