import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
} from "react-native";

type Props = {
  visible: boolean;
  message: string;
};

export default function GameToast({
  visible,
  message,
}: Props) {

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),

        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

    } else {

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),

        Animated.timing(translateY, {
          toValue: 20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

    }
  }, [visible]);

  return (
    <Animated.View
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

    borderRadius: 30,

    elevation: 10,
  },

  text: {

    color: "white",

    fontSize: 18,

    fontWeight: "700",

  },

});