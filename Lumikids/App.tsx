import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";

import PrimaryButton from "./src/components/buttons/PrimaryButton";
import { Colors, Spacing } from "./src/theme";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <PrimaryButton
        title="Let's Learn!"
        onPress={() => console.log("Button Pressed")}
      />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
});