import { TextInput, StyleSheet } from "react-native";

import {
  Colors,
  Radius,
  Spacing,
  Typography,
} from "../../theme";

export default function PrimaryInput() {
  return (
    <TextInput
      placeholder="Enter text..."
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.white,

    borderWidth: 1,

    borderColor: Colors.border,

    borderRadius: Radius.md,

    padding: Spacing.md,

    fontSize: Typography.body,
  },
});