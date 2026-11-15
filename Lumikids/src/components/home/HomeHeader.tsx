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

  container: { alignItems: "flex-start", marginTop: 8, marginBottom: 8 },

  greeting: { fontSize: 12, color: "#2867AD", fontWeight: "800", letterSpacing: 2 },

  name: { marginTop: 6, fontSize: 32, fontWeight: "800", color: "#23394A", lineHeight: 40 },

  subtitle: { marginTop: 6, fontSize: 16, color: "#5D7080", lineHeight: 24 },

});