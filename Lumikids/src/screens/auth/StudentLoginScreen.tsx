import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import PrimaryButton from "../../components/buttons/PrimaryButton";
import PrimaryInput from "../../components/inputs/PrimaryInput";

import { RootStackParamList } from "../../types/navigation";

import { classExists } from "../../services/auth/auth";
import { saveSession } from "../../services/session/session";
import { testFirestore } from "../../services/firebase/test";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "StudentLogin"
>;

export default function StudentLoginScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    testFirestore();
  }, []);

  async function handleLogin() {
    try {
      if (!name.trim()) {
        Alert.alert("Missing Name", "Please enter your name.");
        return;
      }

      if (!classCode.trim()) {
        Alert.alert("Missing Class Code", "Please enter your class code.");
        return;
      }

      setLoading(true);

      const code = classCode.trim().toUpperCase();

      const exists = await classExists(code);

      if (!exists) {
        Alert.alert(
          "Invalid Class Code",
          "Please ask your teacher for the correct class code."
        );
        return;
      }

      if (remember) {
        await saveSession({
          studentId: "TEMP_ID",
          name: name.trim(),
          classCode: code,
          remember: true,
          lastLogin: new Date().toISOString(),
        });
      }

      Alert.alert(
        "Welcome!",
        `${name}, you're ready to start learning!`
      );

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Login Failed",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>👋 Welcome!</Text>

      <Text style={styles.subtitle}>
        Let's start learning.
      </Text>

      <PrimaryInput
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
      />

      <View style={{ height: 16 }} />

      <PrimaryInput
        placeholder="Class Code"
        autoCapitalize="characters"
        value={classCode}
        onChangeText={setClassCode}
      />

      <View style={styles.row}>
        <Text style={styles.remember}>
          Remember Me
        </Text>

        <Switch
          value={remember}
          onValueChange={setRemember}
        />
      </View>

      <PrimaryButton
        title={loading ? "Checking..." : "🚀 Start Learning"}
        onPress={handleLogin}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F8FBFF",
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    color: "#64748B",
    marginBottom: 40,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 24,
  },

  remember: {
    fontSize: 17,
    fontWeight: "600",
  },
});