import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import PrimaryInput from "../../components/inputs/PrimaryInput";
import { RootStackParamList } from "../../types/navigation";
import { classExists } from "../../services/auth/auth";
import { saveSession } from "../../services/session/session";
import { testFirestore } from "../../services/firebase/test";
import { findStudentForLogin } from "../../services/student/createStudent";
import { getStudent } from "../../services/student/studentServices";
import { saveStudent } from "../../services/database/localStudent";
import { initializeStudentProgress } from "../../services/database/localProgress";
import { initializeWritingProgress } from "../../services/database/localWriting";
import { initializeMathProgress } from "../../services/database/localMath";
import { addToSyncQueue } from "../../services/sync/localQueue";
import { processQueue } from "../../services/sync/processQueue";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "StudentLogin">;

export default function StudentLoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    testFirestore().catch(e => console.error("Firestore test failed:", e));
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

      if (!(await classExists(code))) {
        setError("That class code was not found. Please ask your teacher for the correct code.");
        return;
      }

      const studentId = await findStudentForLogin(studentName, code);
      if (!studentId) {
        setError("We could not find your account in this class. Ask your teacher to register you first.");
        return;
      }

      initializeStudentProgress(studentId);
      initializeWritingProgress(studentId);
      initializeMathProgress(studentId);

      const student = await getStudent(studentId);
      if (student) {
        saveStudent(student);
        addToSyncQueue("SYNC_STUDENT", { studentId });
        processQueue();
      }

      await saveSession({ studentId, remember });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      console.error(e);
      setError("Something went wrong while starting your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#62B8FF", "#BFE8FF", "#FFF3C4"]} style={styles.container}>
      <View pointerEvents="none" style={styles.circleOne} />
      <View pointerEvents="none" style={styles.circleTwo} />
      <View pointerEvents="none" style={styles.circleThree} />
      <Text pointerEvents="none" style={styles.cloudLeft}>☁️</Text>
      <Text pointerEvents="none" style={styles.cloudRight}>☁️</Text>

      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.title}>👋 Welcome!</Text>
          <Text style={styles.subtitle}>Let's start learning.</Text>

          <PrimaryInput placeholder="Name" value={name} onChangeText={setName} />
          <View style={{ height: 16 }} />

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryInput placeholder="Class Code" autoCapitalize="characters" value={classCode} onChangeText={setClassCode} />

          <View style={styles.row}>
            <Text style={styles.remember}>Remember Me</Text>
            <Switch value={remember} onValueChange={setRemember} />
          </View>

          <PrimaryButton title={loading ? "Checking..." : "🚀 Start Learning"} onPress={handleLogin} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  form: { flex: 1, justifyContent: "center", width: "100%", maxWidth: 520, alignSelf: "center" },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, elevation: 3 },
  backArrow: { fontSize: 30, lineHeight: 28, fontWeight: "700", color: "#2563EB" },
  backText: { marginLeft: 4, fontSize: 16, fontWeight: "900", color: "#2563EB" },
  title: { fontSize: 34, fontWeight: "700", marginBottom: 8, color: "#1E3A8A" },
  subtitle: { fontSize: 18, color: "#64748B", marginBottom: 40 },
  errorCard: { backgroundColor: "#FFF1F1", borderColor: "#F5B5B5", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  errorText: { color: "#B91C1C", fontWeight: "700", lineHeight: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 24 },
  remember: { fontSize: 17, fontWeight: "600" },
  circleOne: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(255,255,255,0.18)", top: -100, right: -90 },
  circleTwo: { position: "absolute", width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.14)", bottom: 50, left: -80 },
  circleThree: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.18)", top: "38%", right: 18 },
  cloudLeft: { position: "absolute", top: 90, left: 18, fontSize: 34, opacity: 0.55 },
  cloudRight: { position: "absolute", bottom: 120, right: 20, fontSize: 30, opacity: 0.5 },
});
