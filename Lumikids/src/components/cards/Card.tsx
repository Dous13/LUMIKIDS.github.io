import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

import { Colors, Radius, Shadows, Spacing } from "../../theme";

type CardProps = {
  children: ReactNode;
};

export default function Card({ children }: CardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,

    borderRadius: Radius.lg,

    padding: Spacing.lg,

    ...Shadows.card,
  },
});