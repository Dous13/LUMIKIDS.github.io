import React, { useEffect, useRef } from "react";
import { Animated, ViewProps } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Motion } from "../../theme/motion";

/** Replace a static View only; never wrap a drawing surface or camera. */
export default function FadeIn({ delay = 0, style, ...props }: ViewProps & { delay?: number }) {
  const reduce = useReducedMotion();
  // Keep initial content visible while the OS preference is being queried.
  const canEnter = useRef(reduce === false).current;
  const appearance = useRef(new Animated.Value(canEnter ? 0 : 1)).current;
  const entered = useRef(false);
  useEffect(() => {
    if (reduce === null) return;
    if (reduce || !canEnter || entered.current) {
      appearance.setValue(1);
      return;
    }
    entered.current = true;
    const animation = Animated.timing(appearance, {
      toValue: 1, delay, duration: Motion.entrance, easing: Motion.easeOut, useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reduce, appearance, delay, canEnter]);
  return <Animated.View {...props} style={[style, {
    opacity: reduce !== false ? 1 : appearance,
    transform: [{ translateY: reduce !== false ? 0 : appearance.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
  }]} />;
}
