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
  button: { backgroundColor: Colors.primary, minHeight: 58, paddingHorizontal: 20, borderBottomWidth: 4, borderBottomColor: "#0B4F99", paddingVertical: Spacing.md, borderRadius: 18, alignItems: "center", marginTop: 20, justifyContent: "center", shadowColor: "#0B4F99", shadowOpacity: 0.14, shadowRadius: 5, shadowOffset: {"width":0,"height":3}, elevation: 2 },

  disabled: {
    opacity: 0.6,
  },

  text: { color: Colors.white, fontWeight: "800", textAlign: "center", fontSize: Typography.button, lineHeight: 24 },
});
