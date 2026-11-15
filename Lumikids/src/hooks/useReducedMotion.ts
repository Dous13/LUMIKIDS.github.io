import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

// Share one native listener across the presentation components on a screen.
let preference: boolean | null = null;
const listeners = new Set<() => void>();
let subscription: ReturnType<typeof AccessibilityInfo.addEventListener> | undefined;

function update(value: boolean) {
  preference = value;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!subscription) {
    subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", update);
    AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => update(true));
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      subscription?.remove();
      subscription = undefined;
    }
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => preference, () => true);
}
