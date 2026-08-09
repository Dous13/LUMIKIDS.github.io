import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = { target: string };

export default function LetterGuide({ target }: Props) {
  const isWord = target.length > 1;
  return (
    <View pointerEvents="none" style={styles.container}>
      <Text style={[styles.target, isWord && styles.word]}>{target}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  target: { fontSize: 230, fontWeight: "900", color: "#DDE7F0", includeFontPadding: false },
  word: { fontSize: 78, letterSpacing: 4 },
});
