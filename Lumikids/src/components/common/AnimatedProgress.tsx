import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { Motion } from "../../theme/motion";

type Props = { value: number; color?: string; style?: StyleProp<ViewStyle> };

/** Animate only the displayed fill. Progress calculations stay with the caller. */
export default function AnimatedProgress({ value, color = "#237B67", style }: Props) {
  const reduce = useReducedMotion();
  const fraction = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)) / 100;
  const fill = useRef(new Animated.Value(fraction)).current;
  const canEnter = useRef(reduce === false).current;
  const entered = useRef(false);
  useEffect(() => {
    if (reduce === null) return;
    if (reduce) { fill.stopAnimation(); fill.setValue(fraction); return; }
    if (!entered.current) {
      if (canEnter) fill.setValue(0);
      entered.current = true;
    }
    const animation = Animated.timing(fill, { toValue: fraction, duration: Motion.progress, easing: Motion.easeOut, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [fraction, reduce, fill, canEnter]);
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }} style={[styles.track, style]}>
      <Animated.View style={[styles.fill, { backgroundColor: color, transform: [{ scaleX: fill }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 9, width: "100%", borderRadius: 8, overflow: "hidden", backgroundColor: "#E7ECE9" },
  fill: { width: "100%", height: "100%", borderRadius: 8, transformOrigin: "left center" },
});
