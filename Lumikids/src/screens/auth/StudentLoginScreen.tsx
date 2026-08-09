import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
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
import { createStudent } from "../../services/student/createStudent";
import { getStudent } from "../../services/student/studentServices";
import { saveStudent } from "../../services/database/localStudent";
import { initializeStudentProgress } from "../../services/database/localProgress";
import { initializeWritingProgress } from "../../services/database/localWriting";
import { initializeMathProgress } from "../../services/database/localMath";

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
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await testFirestore();
        console.log("Firestore test finished");
      } catch (e) {
        console.error("Firestore test failed:", e);
      }
    })();
  }, []);

async function handleLogin() {
  try {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!classCode.trim()) {
      setError("Please enter your class code.");
      return;
    }

    setError("");
    setLoading(true);

    const code = classCode.trim().toUpperCase();
    const studentName = name.trim();

    // Check if classroom exists
    const exists = await classExists(code);

    if (!exists) {
      setError("That class code was not found. Please ask your teacher for the correct code.");
      return;
    }

    // Create student (or return existing one)
    const studentId = await createStudent(
      studentName,
      code
    );

    initializeStudentProgress(studentId);
    initializeWritingProgress(studentId);
    initializeMathProgress(studentId);

    const student = await getStudent(studentId);

    if (student) {
      saveStudent(student);
    }

    // Save login session
    await saveSession({
      studentId,
      remember,
    });

    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });

  } catch (error) {
    console.error(error);
    setError("Something went wrong while starting your account. Please try again.");
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

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

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

  errorCard: {
    backgroundColor: "#FFF1F1",
    borderColor: "#F5B5B5",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },

  errorText: {
    color: "#B91C1C",
    fontWeight: "700",
    lineHeight: 20,
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