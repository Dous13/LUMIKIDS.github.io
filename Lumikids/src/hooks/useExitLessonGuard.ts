import { useCallback, useState } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

export function useExitLessonGuard(onLeave: () => void) {
  const [visible, setVisible] = useState(false);

  const requestExit = useCallback(() => {
    setVisible(true);
  }, []);

  const stay = useCallback(() => setVisible(false), []);

  const leave = useCallback(() => {
    setVisible(false);
    onLeave();
  }, [onLeave]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        setVisible(true);
        return true;
      });
      return () => subscription.remove();
    }, [])
  );

  return { visible, requestExit, stay, leave };
}
