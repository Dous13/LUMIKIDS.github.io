import { Colors } from "../../theme";
import TouchableOpacity from "../common/MotionTouchable";
import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, Animated, ScrollView } from "react-native";

import ConfettiCannon from "react-native-confetti-cannon";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Motion } from "../../theme/motion";

type Props = {
  visible: boolean;
  mascotImage: any;
  mascotName: string;
  onClose: () => void;
};

export default function RewardModal({
  visible,
  mascotImage,
  mascotName,
  onClose,
}: Props) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const reduce = useReducedMotion();

  useEffect(() => {
    if (visible && reduce === false) {
      scale.setValue(0.96);
      const animation = Animated.timing(scale, {
        toValue: 1,
        duration: Motion.entrance,
        easing: Motion.easeOut,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    } else {
      scale.setValue(1);
    }
  }, [visible, reduce, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>

        {visible && reduce === false ? <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ConfettiCannon
          count={60}
          origin={{ x: -20, y: 0 }}
          fadeOut
        />
        </View> : null}

        <ScrollView style={{ width: "100%" }} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
        <Animated.Image
          source={mascotImage}
          style={[
            styles.image,
            {
              transform: [{ scale }],
            },
          ]}
        />

        <Text style={styles.title}>
          🎉 New Mascot!
        </Text>

        <Text style={styles.name}>
          {mascotName}
        </Text>

        <Text style={styles.subtitle}>
          You unlocked a new friend!
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>
            Continue
          </Text>
        </TouchableOpacity>
        </ScrollView>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  overlay: { flex: 1, backgroundColor: "rgba(23,44,60,0.92)", justifyContent: "center", alignItems: "center", padding: 24 },

  image: { width: 200, height: 200, resizeMode: "contain", marginBottom: 16 },

  title: { fontSize: 30, textAlign: "center", fontWeight: "800", color: "white", lineHeight: 38 },

  name: { textAlign: "center", fontSize: 26, color: "#FFD54F", fontWeight: "900", marginTop: 8, lineHeight: 35 },

  subtitle: { textAlign: "center", lineHeight: 25, fontSize: 17, color: "white", marginTop: 15, marginBottom: 24 },

  button: { backgroundColor: Colors.primary, paddingHorizontal: 35, paddingVertical: 15, borderRadius: 18, width: "100%", maxWidth: 320, minHeight: 54, borderBottomWidth: 4, borderBottomColor: Colors.primaryDark, alignItems: "center" },

  buttonText: { color: "white", fontWeight: "800", fontSize: 19, lineHeight: 26, textAlign: "center" },
});
