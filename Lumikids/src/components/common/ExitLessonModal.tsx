import TouchableOpacity from "../common/MotionTouchable";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

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
  card: { width: "100%", maxWidth: 420, backgroundColor: "#FFF", borderRadius: 22, padding: 26, alignItems: "center", elevation: 12 },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "900", color: "#23394A", textAlign: "center" },
  message: { marginTop: 10, fontSize: 16, lineHeight: 23, color: "#5D7080", textAlign: "center" },
  buttons: { width: "100%", flexDirection: "row", gap: 10, marginTop: 22 },
  stay: { flex: 1, backgroundColor: "#2867AD", borderRadius: 16, paddingVertical: 14, alignItems: "center", minHeight: 52 },
  stayText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  leave: { flex: 1, backgroundColor: "#FFF0EC", borderRadius: 16, paddingVertical: 14, alignItems: "center", minHeight: 52 },
  leaveText: { color: "#B91C1C", fontWeight: "900", fontSize: 15 },
});
