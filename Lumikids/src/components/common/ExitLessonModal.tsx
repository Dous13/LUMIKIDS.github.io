import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  onStay: () => void;
  onLeave: () => void;
};

export default function ExitLessonModal({
  visible,
  title = "Stop this lesson?",
  message = "Your progress from this lesson will not be saved if you leave now.",
  onStay,
  onLeave,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onStay}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🤔</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.stay} onPress={onStay} activeOpacity={0.85}>
              <Text style={styles.stayText}>Keep Learning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leave} onPress={onLeave} activeOpacity={0.85}>
              <Text style={styles.leaveText}>Stop Lesson</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(30,41,59,0.42)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 420, backgroundColor: "#FFF", borderRadius: 30, padding: 26, alignItems: "center", elevation: 12 },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 25, fontWeight: "900", color: "#334155", textAlign: "center" },
  message: { marginTop: 10, fontSize: 16, lineHeight: 23, color: "#64748B", textAlign: "center" },
  buttons: { width: "100%", flexDirection: "row", gap: 12, marginTop: 22 },
  stay: { flex: 1, backgroundColor: "#EAF8FF", borderRadius: 18, paddingVertical: 14, alignItems: "center" },
  stayText: { color: "#275B8F", fontWeight: "900", fontSize: 15 },
  leave: { flex: 1, backgroundColor: "#FFE4E4", borderRadius: 18, paddingVertical: 14, alignItems: "center" },
  leaveText: { color: "#B91C1C", fontWeight: "900", fontSize: 15 },
});
