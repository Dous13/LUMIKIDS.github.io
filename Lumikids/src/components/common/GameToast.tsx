import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
} from "react-native";

import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Motion } from "../../theme/motion";

type Props = {
  visible: boolean;
  message: string;
};

export default function GameToast({
  visible,
  message,
}: Props) {

  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Keep feedback readable without movement when the OS requests less motion.
    if (reduceMotion !== false) translateY.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: reduceMotion !== false ? Motion.press : Motion.entrance,
        easing: Motion.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: reduceMotion !== false || visible ? 0 : 12,
        duration: Motion.entrance,
        easing: Motion.easeOut,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [visible, reduceMotion, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityElementsHidden={!visible}
      style={[
        styles.container,
        {
          opacity,
          transform: [
            {
              translateY,
            },
          ],
        },
      ]}
    >
      <Text style={styles.text}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({

  container: {

    position: "absolute",

    bottom: 35,

    alignSelf: "center",

    backgroundColor: "#1F2937",

    paddingHorizontal: 24,
    paddingVertical: 14,

    borderRadius: 16,
    maxWidth: "88%",

    elevation: 10,
  },

  text: {

    color: "white",

    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",

    fontWeight: "700",

  },

});