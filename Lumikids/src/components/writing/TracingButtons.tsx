import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";

type Props = {
  onClear: () => void;
  onNext: () => void;
};

export default function TracingButtons({
  onClear,
  onNext,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.clearButton}
        onPress={onClear}
      >
        <Text style={styles.buttonText}>
          🗑 Clear
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>
          Next →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  clearButton: {
    backgroundColor: "#F87171",
    padding: 15,
    borderRadius: 18,
  },

  nextButton: {
    backgroundColor: "#4DA8FF",
    padding: 15,
    borderRadius: 18,
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },
});