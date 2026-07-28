import { Pressable, Text, StyleSheet } from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../theme";

type Props = {
  title: string;
  onPress: () => void;
};

export default function PrimaryButton({
  title,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
    >
      <Text style={styles.text}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,

    paddingVertical: Spacing.md,

    borderRadius: Radius.lg,

    alignItems: "center",
  },

  text: {
    color: Colors.white,
    fontSize: Typography.button,
    fontWeight: "600",
  },
});