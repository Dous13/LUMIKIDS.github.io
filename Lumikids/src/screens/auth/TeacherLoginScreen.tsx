import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import PrimaryInput from "../../components/inputs/PrimaryInput";
import { loginTeacher, registerTeacher } from "../../services/teacher/teacherService";

export default function TeacherLoginScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Your password should be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      if (mode === "register") await registerTeacher(name, email, password);
      else await loginTeacher(email, password);
      navigation.reset({ index: 0, routes: [{ name: "TeacherHome" }] });
    } catch (e: any) {
      const code = e?.code || "";
      if (code.includes("auth/email-already-in-use")) setError("That email is already registered. Try signing in instead.");
      else if (code.includes("auth/invalid-credential")) setError("The email or password is incorrect.");
      else if (code.includes("auth/weak-password")) setError("Please choose a stronger password.");
      else setError("We could not open the teacher portal. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#62B8FF", "#BFE8FF", "#FFF3C4"]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.hero}>
              <Text style={styles.heroEmoji}>👩‍🏫</Text>
              <Text style={styles.kicker}>LUMIKIDS TEACHER PORTAL</Text>
              <Text style={styles.title}>{mode === "login" ? "Welcome back!" : "Create your teacher account"}</Text>
              <Text style={styles.subtitle}>Manage your classes and help your learners grow. 🌟</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, mode === "login" && styles.activeTab]} onPress={() => { setMode("login"); setError(""); }}>
                  <Text style={[styles.tabText, mode === "login" && styles.activeTabText]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, mode === "register" && styles.activeTab]} onPress={() => { setMode("register"); setError(""); }}>
                  <Text style={[styles.tabText, mode === "register" && styles.activeTabText]}>Register</Text>
                </TouchableOpacity>
              </View>

              {mode === "register" && <PrimaryInput placeholder="Your Full Name" value={name} onChangeText={setName} />}
              {mode === "register" && <View style={{ height: 12 }} />}
              <PrimaryInput placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              <View style={{ height: 12 }} />
              <PrimaryInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

              {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

              <PrimaryButton title={loading ? "Please wait..." : mode === "login" ? "👩‍🏫 Open Teacher Home" : "✨ Create Teacher Account"} onPress={submit} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safe: { flex: 1 }, content: { padding: 20, paddingBottom: 40 },
  back: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,.92)", borderRadius: 22, paddingHorizontal: 15, paddingVertical: 10, elevation: 3 }, backText: { color: "#2563EB", fontWeight: "900", fontSize: 16 },
  hero: { alignItems: "center", marginTop: 24, marginBottom: 18 }, heroEmoji: { fontSize: 68 }, kicker: { marginTop: 5, color: "#2563EB", fontWeight: "900", letterSpacing: 1.2, fontSize: 12 }, title: { marginTop: 4, fontSize: 29, fontWeight: "900", color: "#1E3A8A", textAlign: "center" }, subtitle: { marginTop: 7, color: "#475569", textAlign: "center", lineHeight: 21, fontSize: 15 },
  card: { backgroundColor: "rgba(255,255,255,.96)", borderRadius: 30, padding: 22, elevation: 7 }, tabs: { flexDirection: "row", backgroundColor: "#EEF5FB", borderRadius: 16, padding: 4, marginBottom: 18 }, tab: { flex: 1, paddingVertical: 11, borderRadius: 13, alignItems: "center" }, activeTab: { backgroundColor: "#FFF", elevation: 2 }, tabText: { color: "#64748B", fontWeight: "800" }, activeTabText: { color: "#2563EB" }, error: { marginTop: 14, backgroundColor: "#FFF1F1", borderRadius: 14, padding: 12 }, errorText: { color: "#B91C1C", fontWeight: "700", lineHeight: 20 },
});
