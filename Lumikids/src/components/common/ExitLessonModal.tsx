import { Colors } from "../../theme";
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
  card: { width: "100%", maxWidth: 420, backgroundColor: Colors.white, borderRadius: 24, padding: 22, alignItems: "center", elevation: 12, borderWidth: 1, borderColor: Colors.teacherBorder },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text, textAlign: "center", lineHeight: 32 },
  message: { marginTop: 10, fontSize: 16, lineHeight: 23, color: Colors.textSecondary, textAlign: "center" },
  buttons: { width: "100%", flexDirection: "row", gap: 10, marginTop: 22, flexWrap: "wrap" },
  stay: { flex: 1, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: "center", minHeight: 52, minWidth: 120, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },
  stayText: { color: Colors.white, fontWeight: "900", fontSize: 15, lineHeight: 22, textAlign: "center" },
  leave: { flex: 1, backgroundColor: Colors.errorSurface, borderRadius: 16, paddingVertical: 14, alignItems: "center", minHeight: 52, minWidth: 120, borderWidth: 1, borderColor: "#E8BCB5" },
  leaveText: { color: "#B91C1C", fontWeight: "900", fontSize: 15, lineHeight: 22, textAlign: "center" },
});
