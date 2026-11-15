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
  input: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 2, borderColor: "#C3DAEB", minHeight: 56, paddingHorizontal: 18, paddingVertical: 14, fontSize: 17, color: Colors.text },
  focused: { borderColor: Colors.primary, backgroundColor: "#F6FBFF" },
});
