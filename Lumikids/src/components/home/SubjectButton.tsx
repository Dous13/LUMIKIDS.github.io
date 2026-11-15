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
        { backgroundColor: color, borderBottomColor: subject.ink, shadowColor: subject.ink },
      ]}
      onPress={onPress}
    >

      <View style={[styles.icon, { borderBottomColor: subject.ink }]}><Ionicons name={subject.icon} size={30} color={subject.ink} /></View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: subject.ink }]}>{title}</Text>
        <Text style={styles.hint}>{subject.hint}</Text>
      </View>
      <Ionicons name="arrow-forward" size={22} color={subject.ink} />
    </MotionTouchable>
  );
}

const styles = StyleSheet.create({

  button: { minHeight: 92, padding: 16, borderRadius: 22, flexDirection: "row", alignItems: "center", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: {"width":0,"height":3}, elevation: 3, borderWidth: 1, borderColor: "rgba(35,57,74,0.07)", borderBottomWidth: 4 },

  icon: { width: 54, height: 54, borderRadius: 17, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 14, borderWidth: 1, borderColor: "rgba(35,57,74,0.08)", borderBottomWidth: 2 },
  body: { flex: 1, minWidth: 0 },
  hint: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 2 },

  title: { color: "#23394A", fontSize: 23, fontWeight: "800", lineHeight: 29 },

});
