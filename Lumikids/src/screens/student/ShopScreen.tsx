import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet } from "react-native";

export default function ShopScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        🛒 Sticker Shop
      </Text>

      <Text style={styles.subtitle}>
        Coming Soon!
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 20,
    fontSize: 20,
    color: "#64748B",
  },
});