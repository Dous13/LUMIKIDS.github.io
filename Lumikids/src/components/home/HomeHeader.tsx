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
        ☀️ Good Morning
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

  container: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  greeting: {
    fontSize: 18,
    color: "#ffffff",
  },

  name: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: "800",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 17,
    color: "#ffffff",
  },

});