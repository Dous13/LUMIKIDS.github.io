import { useEffect, useRef } from "react";
import { Animated, AppState, Easing } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useReducedMotion } from "./useReducedMotion";

/** Presentation-only idle motion shared by existing decorations and mascots. */
export function useAmbientFloat(duration = 8000) {
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    function updateMotion(state: string | null | undefined) {
      animation?.stop();
      drift.setValue(0);
      if (state !== "active" || !focused || reduceMotion !== false) return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
        Animated.timing(drift, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      ]));
      animation.start();
    }
    updateMotion(AppState.currentState);
    const subscription = AppState.addEventListener("change", updateMotion);
    return () => {
      subscription.remove();
      animation?.stop();
      drift.setValue(0);
    };
  }, [focused, reduceMotion, duration, drift]);

  return drift;
}
