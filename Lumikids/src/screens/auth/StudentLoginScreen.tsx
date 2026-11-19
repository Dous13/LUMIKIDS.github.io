import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useRef, useState } from "react";
import { Animated, View, Text, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Switch } from "react-native";
import FadeIn from "../../components/common/FadeIn";
import { useAmbientFloat } from "../../hooks/useAmbientFloat";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import PrimaryInput from "../../components/inputs/PrimaryInput";
import { RootStackParamList } from "../../types/navigation";
import { loginStudent } from "../../services/student/studentLogin";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "StudentLogin">;

export default function StudentLoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [remember, setRemember] = useState(true);
  const submitting = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const drift = useAmbientFloat();

  async function handleLogin() {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      await loginStudent(name, classCode, remember);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Your student account could not be opened. Please try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#EAF7FF", "#EAF7FF"]} style={styles.container}>
      <Animated.View pointerEvents="none" accessible={false} style={[styles.circleOne, { transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) }] }]} />
      <Animated.View pointerEvents="none" accessible={false} style={[styles.circleTwo, { transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }]} />
      <View pointerEvents="none" style={styles.circleThree} />
      <Text pointerEvents="none" style={styles.cloudLeft}>☁️</Text>
      <Text pointerEvents="none" style={styles.cloudRight}>☁️</Text>

      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeIn style={styles.form}>
          <Image source={require("../../../assets/images/mascot.png")} style={styles.welcomeMascot} resizeMode="contain" accessibilityIgnoresInvertColors />
          <Text style={styles.brand}>LUMIKIDS</Text>
          <Text style={styles.title}>Hello, little explorer!</Text>
          <Text style={styles.subtitle}>Let's start learning.</Text>

          <Text style={styles.label}>Student Name</Text>
          <PrimaryInput accessibilityLabel="Student Name" placeholder="Name" value={name} onChangeText={setName}
            autoCapitalize="words" editable={!loading} />
          <View style={{ height: 16 }} />

          <Text style={styles.label}>Classroom Code</Text>
          <PrimaryInput accessibilityLabel="Classroom Code" placeholder="Class Code" value={classCode}
            onChangeText={setClassCode} autoCapitalize="characters" autoCorrect={false} editable={!loading} />

          {error ? (
            <View style={styles.errorCard}>
              <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.rememberRow}>
            <Text style={styles.rememberLabel}>Remember Me</Text>
            <Switch value={remember} onValueChange={setRemember} accessibilityLabel="Remember me" disabled={loading}
              trackColor={{ false: "#CBD6DA", true: "#176BC1" }} />
          </View>
          <PrimaryButton title={loading ? "Checking..." : "Start Learning →"} onPress={handleLogin} />
        </FadeIn>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  formScroll: { flexGrow: 1, justifyContent: "center", paddingTop: 16, paddingBottom: 24 },
  welcomeMascot: { width: 84, height: 84, marginBottom: 10, alignSelf: "center" },
  brand: { fontSize: 11, fontWeight: "800", letterSpacing: 2, color: "#176BC1", marginBottom: 6, textAlign: "center" },
  label: { fontSize: 15, fontWeight: "700", color: "#23394A", marginBottom: 8, lineHeight: 21 },
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  form: { flex: 0, justifyContent: "center", width: "100%", maxWidth: 440, alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 26, padding: 20, borderWidth: 1, borderColor: "#C5E1F4", borderBottomWidth: 3 },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, elevation: 0, minHeight: 44, borderWidth: 1, borderColor: "#C5E1F4" },
  backArrow: { fontSize: 30, lineHeight: 28, fontWeight: "700", color: "#176BC1" },
  backText: { marginLeft: 4, fontSize: 16, fontWeight: "700", color: "#176BC1" },
  title: { fontSize: 29, fontWeight: "800", marginBottom: 8, color: "#23394A", lineHeight: 36, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#5D7080", marginBottom: 22, lineHeight: 24, textAlign: "center" },
  errorCard: { backgroundColor: "#FFF1F1", borderColor: "#F5B5B5", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  errorText: { color: "#B91C1C", fontWeight: "700", lineHeight: 20 },
  rememberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 18 },
  rememberLabel: { fontSize: 15, fontWeight: "700", color: "#23394A" },
  circleOne: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "#39A9EC", top: -100, right: -90, display: "flex", opacity: 0.12 },
  circleTwo: { position: "absolute", width: 170, height: 170, borderRadius: 85, backgroundColor: "#FFC84A", bottom: 50, left: -80, display: "flex", opacity: 0.14 },
  circleThree: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.18)", top: "38%", right: 18, display: "none" },
  cloudLeft: { position: "absolute", top: 90, left: 18, fontSize: 34, opacity: 0.55, display: "none" },
  cloudRight: { position: "absolute", bottom: 120, right: 20, fontSize: 30, opacity: 0.5, display: "none" },
});
