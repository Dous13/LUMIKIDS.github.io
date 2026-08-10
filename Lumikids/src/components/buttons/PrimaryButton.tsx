import { Pressable, StyleSheet, Text } from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../theme";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,

    paddingVertical: Spacing.md,

    borderRadius: Radius.lg,

    alignItems: "center",

    marginTop: 20,
  },

  disabled: {
    opacity: 0.6,
  },

  text: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: Typography.button,
  },
});