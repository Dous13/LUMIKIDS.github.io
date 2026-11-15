import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";

import { Colors, Radius, Spacing, Typography } from "../../theme";

interface Props extends TextInputProps {}

export default function PrimaryInput(props: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      placeholderTextColor="#6B7D8C"
      onFocus={event => { setFocused(true); props.onFocus?.(event); }}
      onBlur={event => { setFocused(false); props.onBlur?.(event); }}
      style={[styles.input, focused && styles.focused, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: "#CBD6DA",
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: Typography.body,
    color: Colors.text,
  },
  focused: { borderColor: Colors.primary, backgroundColor: "#F5FAFF" },
});
