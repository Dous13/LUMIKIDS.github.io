import TouchableOpacity from "../common/MotionTouchable";
import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet, Animated } from "react-native";

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

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(23,44,60,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  image: {
    width: 220,
    height: 220,
    resizeMode: "contain",
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    textAlign: "center",
    fontWeight: "900",
    color: "white",
  },

  name: {
    textAlign: "center",
    fontSize: 28,
    color: "#FFD54F",
    fontWeight: "900",
    marginTop: 8,
  },

  subtitle: {
    textAlign: "center",
    lineHeight: 26,
    fontSize: 18,
    color: "white",
    marginTop: 15,
    marginBottom: 35,
  },

  button: {
    backgroundColor: "#2867AD",
    paddingHorizontal: 35,
    paddingVertical: 15,
    borderRadius: 20,
  },

  buttonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 20,
  },
});
