import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

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
  overlay:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"rgba(0,0,0,.35)",
  },

  card:{
    width:"82%",
    backgroundColor:"white",
    borderRadius:28,
    padding:30,
    alignItems:"center",
  },

  emoji:{
    fontSize:70,
  },

  title:{
    fontSize:28,
    fontWeight:"900",
    marginTop:15,
  },

  message:{
    fontSize:18,
    textAlign:"center",
    marginVertical:20,
    color:"#475569",
  },

  button:{
    backgroundColor:"#4DA8FF",
    paddingHorizontal:35,
    paddingVertical:14,
    borderRadius:20,
  },

  buttonText:{
    color:"white",
    fontWeight:"800",
    fontSize:18,
  },
});