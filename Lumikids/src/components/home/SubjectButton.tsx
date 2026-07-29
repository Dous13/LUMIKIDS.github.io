import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  emoji: string;
  title: string;
  color: string;
  onPress: () => void;
};

export default function SubjectButton({
  emoji,
  title,
  color,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.button,
        { backgroundColor: color },
      ]}
      onPress={onPress}
    >

      <Text style={styles.emoji}>
        {emoji}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  button: {
    height: 120,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,
  },

  emoji: {
    fontSize: 42,
  },

  title: {
    marginTop: 10,
    color: "White",
    fontSize: 28,
    fontWeight: "800",
  },

});