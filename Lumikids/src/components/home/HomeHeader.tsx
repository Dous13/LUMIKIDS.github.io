import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  name: string;
};

export default function HomeHeader({
  name,
}: Props) {
  return (
    <View style={styles.container}>

      <Text style={styles.greeting}>
        LUMIKIDS · LET’S LEARN
      </Text>

      <Text style={styles.name}>
        Hi, {name}!
      </Text>

      <Text style={styles.subtitle}>
        Ready to play and learn?
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  container: { alignItems: "flex-start", marginTop: 4, marginBottom: 4 },

  greeting: { fontSize: 11, color: "#176BC1", fontWeight: "800", letterSpacing: 1.6 },

  name: { marginTop: 4, fontSize: 30, fontWeight: "800", color: "#23394A", lineHeight: 38 },

  subtitle: { marginTop: 2, fontSize: 16, color: "#5D7080", lineHeight: 23 },

});