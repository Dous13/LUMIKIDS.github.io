import { Colors } from "../../theme";
import TouchableOpacity from "../common/MotionTouchable";
import React from "react";
import { Modal, View, Text, StyleSheet } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  emoji: string;
  buttonText?: string;
  onClose: () => void;
};

export default function ShopModal({
  visible,
  title,
  message,
  emoji,
  buttonText = "OK",
  onClose,
}: Props) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          <Text style={styles.emoji}>
            {emoji}
          </Text>

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.message}>
            {message}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {buttonText}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor:"rgba(0,0,0,.35)", paddingVertical: 24 },

  card:{ width: "88%", backgroundColor:"white", borderRadius: 22, padding: 24, alignItems:"center", maxWidth: 440, borderWidth: 1, borderColor: Colors.teacherBorder, borderBottomWidth: 3 },

  emoji:{
    fontSize:70,
  },

  title:{ fontSize: 25, fontWeight: "800", marginTop:15, color: Colors.text, textAlign: "center", lineHeight: 33 },

  message:{ fontSize: 17, textAlign:"center", marginVertical:20, color: Colors.textSecondary, lineHeight: 25 },

  button:{ backgroundColor: Colors.primary, paddingHorizontal:35, paddingVertical:14, borderRadius: 16, minHeight: 52, width: "100%", borderBottomWidth: 3, borderBottomColor: Colors.primaryDark, justifyContent: "center" },

  buttonText:{ color:"white", fontWeight:"800", fontSize:18, lineHeight: 25, textAlign: "center" },
});