import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
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
    <LinearGradient colors={["#FAF8F2", "#FAF8F2"]} style={styles.container}>
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
              <Text style={styles.subtitle}>Manage your classes and help your learners grow.</Text>
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

              <PrimaryButton title={loading ? "Please wait..." : mode === "login" ? "Sign in" : " Create Account"} onPress={submit} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  }, safe: { flex: 1 }, content: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 560, alignSelf: "center" },
  back: { alignSelf: "flex-start", backgroundColor: "transparent", borderRadius: 22, paddingHorizontal: 0, paddingVertical: 10, elevation: 0, minHeight: 44 }, backText: { color: "#2867AD", fontWeight: "900", fontSize: 16 },
  hero: { alignItems: "flex-start", marginTop: 24, marginBottom: 24 }, heroEmoji: { fontSize: 68, display: "none" }, kicker: { marginTop: 5, color: "#2867AD", fontWeight: "900", letterSpacing: 1.5, fontSize: 11 }, title: { marginTop: 10, fontSize: 30, fontWeight: "900", color: "#23394A", textAlign: "left", lineHeight: 38 }, subtitle: { marginTop: 7, color: "#5D7080", textAlign: "left", lineHeight: 24, fontSize: 16 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 22, elevation: 1, borderWidth: 1, borderColor: "#E1E7E5" }, tabs: { flexDirection: "row", backgroundColor: "#EEF2F3", borderRadius: 12, padding: 4, marginBottom: 18 }, tab: { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: "center", minHeight: 44 }, activeTab: { backgroundColor: "#FFF", elevation: 0 }, tabText: { color: "#64748B", fontWeight: "800", fontSize: 15 }, activeTabText: { color: "#2867AD" }, error: { marginTop: 14, backgroundColor: "#FFF1F1", borderRadius: 14, padding: 12 }, errorText: { color: "#B91C1C", fontWeight: "700", lineHeight: 20 },
});
