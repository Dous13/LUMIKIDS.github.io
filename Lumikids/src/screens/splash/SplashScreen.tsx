import { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../types/navigation";
import { Colors, Typography, Spacing } from "../../theme";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    console.log("Splash Screen Loaded");

    const timer = setTimeout(() => {
      console.log("Going to Welcome...");
      navigation.replace("Welcome");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/images/splashicon.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>LUMIKIDS</Text>
      <Text style={styles.subtitle}>Learn • Play • Grow</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.display,
    fontWeight: "700",
    color: Colors.primary,
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
});