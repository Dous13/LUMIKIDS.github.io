import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MotionTouchable from "../common/MotionTouchable";
import { Colors } from "../../theme";

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
  const subject = title === "Reading"
    ? { icon: "book-outline" as const, ink: Colors.reading, hint: "Letters & sounds" }
    : title === "Writing"
    ? { icon: "pencil-outline" as const, ink: Colors.writing, hint: "One stroke at a time" }
    : { icon: "shapes-outline" as const, ink: Colors.math, hint: "Numbers & discovery" };
  return (
    <MotionTouchable
      activeOpacity={0.85}
      style={[
        styles.button,
        { backgroundColor: color },
      ]}
      onPress={onPress}
    >

      <View style={styles.icon}><Ionicons name={subject.icon} size={30} color={subject.ink} /></View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{subject.hint}</Text>
      </View>
      <Ionicons name="arrow-forward" size={22} color={subject.ink} />
    </MotionTouchable>
  );
}

const styles = StyleSheet.create({

  button: {
    minHeight: 96,
    padding: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 1,
  },

  icon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 16 },
  body: { flex: 1, minWidth: 0 },
  hint: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 3 },

  title: {
    color: Colors.text,
    fontSize: 23,
    fontWeight: "800",
  },

});
