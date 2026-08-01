import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";

import ConfettiCannon from "react-native-confetti-cannon";

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
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>

        <ConfettiCannon
          count={150}
          origin={{ x: -20, y: 0 }}
          fadeOut
        />

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
    backgroundColor: "rgba(0,0,0,0.45)",
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
    fontSize: 36,
    fontWeight: "900",
    color: "white",
  },

  name: {
    fontSize: 28,
    color: "#FFD54F",
    fontWeight: "900",
    marginTop: 8,
  },

  subtitle: {
    fontSize: 18,
    color: "white",
    marginTop: 15,
    marginBottom: 35,
  },

  button: {
    backgroundColor: "#4DA8FF",
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