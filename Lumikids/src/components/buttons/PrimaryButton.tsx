import { StyleSheet, Text } from "react-native";
import MotionTouchable from "../common/MotionTouchable";
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
    <MotionTouchable
      style={[
        styles.button,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </MotionTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    minHeight: 56,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: "#1D4E8A",

    paddingVertical: Spacing.md,

    borderRadius: Radius.md,

    alignItems: "center",

    marginTop: 20,
  },

  disabled: {
    opacity: 0.6,
  },

  text: {
    color: Colors.white,
    fontWeight: "800",
    textAlign: "center",
    fontSize: Typography.button,
  },
});
