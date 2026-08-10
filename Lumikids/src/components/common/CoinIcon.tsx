import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = { size?: number };

export default function CoinIcon({ size = 22 }: Props) {
  return (
    <View
      style={[
        styles.coin,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.symbol, { fontSize: Math.max(9, size * 0.52) }]}>★</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    backgroundColor: "#FFD54F",
    borderWidth: 2,
    borderColor: "#E5A900",
    alignItems: "center",
    justifyContent: "center",
  },
  symbol: { color: "#A56A00", fontWeight: "900" },
});
