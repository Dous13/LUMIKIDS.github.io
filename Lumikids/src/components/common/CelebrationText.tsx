import React, { useEffect, useRef } from "react";
import { Animated, TextProps } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Motion } from "../../theme/motion";

/** A short reward reveal; the displayed amount is always the actual amount. */
export default function CelebrationText({ style, ...props }: TextProps) {
  const reduce = useReducedMotion();
  const scale = useRef(new Animated.Value(reduce === false ? 0.94 : 1)).current;
  useEffect(() => {
    if (reduce !== false) { scale.setValue(1); return; }
    scale.setValue(0.94);
    const animation = Animated.timing(scale, { toValue: 1, duration: Motion.entrance, easing: Motion.easeOut, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduce, scale]);
  return <Animated.Text {...props} style={[style, { transform: [{ scale }] }]} />;
}
