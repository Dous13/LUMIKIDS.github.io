import React from "react";
import {
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";

import { Colors, Radius, Spacing, Typography } from "../../theme";

interface Props extends TextInputProps {}

export default function PrimaryInput(props: Props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#94A3B8"
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: Typography.body,
    color: Colors.text,
  },
});