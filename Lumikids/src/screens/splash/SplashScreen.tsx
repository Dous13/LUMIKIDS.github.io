import { useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../types/navigation";
import { Colors, Typography, Spacing } from "../../theme";

import { getSession } from "../../services/session/session";
import { restoreStudentProgress } from "../../services/sync/restoreStudentProgress";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();

useEffect(() => {
  async function initializeApp() {
    try {
      // Show splash screen for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      const session = await getSession();

      console.log("[SPLASH] Restored session:", session);
      if (session && session.remember) {
        console.log("Student session found.");

        try {
          await restoreStudentProgress(session.studentId);
        } catch (error) {
          // Allow offline learning using the existing SQLite data.
          // The pending sync job will retry when Firebase is available.
          console.warn(
            "[SPLASH] Cloud progress unavailable. Using local progress.",
            error
          );
        }

        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        console.log("No saved session.");

        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      }
    } catch (error) {
      console.error(error);

      navigation.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    }
  }

  initializeApp();
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