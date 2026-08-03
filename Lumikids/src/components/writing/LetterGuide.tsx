import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  letter: string;
};

export default function LetterGuide({
  letter,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.letter}>
        {letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  letter: {
  fontSize: 260,
  fontWeight: "900",
  color: "#DDDDDD",
  includeFontPadding: false,
  marginLeft: 35,
  },
});