import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Motion } from "../../theme/motion";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/** Same touchable and handlers, with a small, interruptible press response. */
export default function MotionTouchable({ style, onPressIn, onPressOut, disabled, ...props }: TouchableOpacityProps) {
  const reduce = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduce !== false || disabled) {
      scale.stopAnimation();
      scale.setValue(1);
    }
    return () => scale.stopAnimation();
  }, [reduce, disabled, scale]);

  function animate(toValue: number) {
    if (reduce !== false || disabled) return;
    Animated.timing(scale, { toValue, duration: Motion.press, easing: Motion.easeOut, useNativeDriver: true }).start();
  }

  const transform = StyleSheet.flatten(style)?.transform;
  return (
    <AnimatedTouchable
      accessibilityRole="button"
      activeOpacity={0.8}
      {...props}
      disabled={disabled}
      style={[style, { transform: [...(Array.isArray(transform) ? transform : []), { scale }] }]}
      onPressIn={event => { animate(0.98); onPressIn?.(event); }}
      onPressOut={event => { animate(1); onPressOut?.(event); }}
    />
  );
}
