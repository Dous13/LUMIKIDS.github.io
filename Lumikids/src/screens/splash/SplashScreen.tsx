import { useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../types/navigation";
import { Colors, Typography, Spacing } from "../../theme";
import { restoreRememberedSession } from "../../services/session/session";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      const session = await restoreRememberedSession().catch(() => null);
      if (active) navigation.reset({ index: 0, routes: [{ name: session ? "Home" : "Welcome" }] });
    }, 2000);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/images/splashicon.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>LUMIKIDS</Text>

      <Text style={styles.subtitle}>
        Learn • Play • Grow
      </Text>

      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={{ marginTop: 40 }}
      />
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
