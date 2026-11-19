import FadeIn from "../../components/common/FadeIn";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAmbientFloat } from "../../hooks/useAmbientFloat";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSession } from "../../services/session/session";
import { hasStudentCloudSession, logoutStudent } from "../../services/student/studentLogin";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import HomeHeader from "../../components/home/HomeHeader";
import MascotCard from "../../components/home/MascotCard";
import SubjectButton from "../../components/home/SubjectButton";
import BottomMenu from "../../components/home/BottomMenu";
import { useStudent } from "../../hooks/useStudent";
import {
  getLevel,
  getXPProgress,
  getCurrentLevelXP,
  getNextLevelXP,
} from "../../utils/xp";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [studentId, setStudentId] = useState("");
  const [logoutPrompt, setLogoutPrompt] = useState(false);
  const [cloudAvailable, setCloudAvailable] = useState(true);
  const backgroundDrift = useAmbientFloat();

  useEffect(() => {
    async function loadSession() {
      const session = await getSession();

      if (!session) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
        return;
      }

      setStudentId(session.studentId);
    }

    loadSession();
  }, [navigation]);

  const {
    student,
    loading,
    reload,
  } = useStudent(studentId);

  useFocusEffect(
    React.useCallback(() => {
      reload();
    }, [reload, studentId])
  );

  useEffect(() => {
    if (!studentId) return;
    const update = () => setCloudAvailable(hasStudentCloudSession(studentId));
    update();
    const timer = setInterval(update, 2000);
    return () => clearInterval(timer);
  }, [studentId]);

  async function logout() {
    await logoutStudent().catch(() => undefined);
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  }

  if (loading || studentId === "") {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#176BC1"
        />
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Student not found.
        </Text>
      </SafeAreaView>
    );
  }

  const level = getLevel(student.xp);
  const progress = getXPProgress(student.xp);
  const nextLevelXP = getNextLevelXP(level);

  return (
    <LinearGradient
      colors={["#EAF7FF", "#EAF7FF"]}
      style={styles.container}
    >
      <Animated.View pointerEvents="none" accessible={false} style={[styles.circle1, { transform: [
        { translateY: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
        { translateX: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      ] }]} />
      <Animated.View pointerEvents="none" accessible={false} style={[styles.circle2, { transform: [
        { translateY: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] }) },
      ] }]} />
      <Animated.View pointerEvents="none" accessible={false} style={[styles.circle3, { transform: [
        { translateY: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
        { translateX: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
      ] }]} />
      <Animated.View pointerEvents="none" accessible={false} style={[styles.circle4, { transform: [
        { translateY: backgroundDrift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
      ] }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <HomeHeader name={student.name}/>
          {!cloudAvailable && (
            <TouchableOpacity accessibilityRole="button" style={styles.reconnect}
              onPress={() => navigation.navigate("StudentLogin")}>
              <Text style={styles.reconnectText}>Sign in to sync your saved progress</Text>
            </TouchableOpacity>
          )}

          <MascotCard avatar={student.avatar} />

          <FadeIn delay={40}>
          <SubjectButton
            emoji="📖"
            title="Reading"
            color="#FFDDC5"
            onPress={() => navigation.navigate("Reading")}
          />

          <SubjectButton
            emoji="✏️"
            title="Writing"
            color="#E4D4FF"
            onPress={() =>
              navigation.navigate("Writing")
            }
          />

          <SubjectButton
            emoji="🔢"
            title="Math"
            color="#BDEDE1"
            onPress={() => navigation.navigate("Math")
            }
          />

          </FadeIn>
        </ScrollView>
        <BottomMenu
          xp={student.xp}
          coins={student.coins}
          level={level}
          progress={progress}
          streak={student.streak}
          onShopPress={() => navigation.navigate("Shop")}
          onDashboardPress={() => navigation.navigate("Dashboard")}
          onParentPress={() => setLogoutPrompt(true)}
        />
        {logoutPrompt ? (
          <View style={styles.logoutPrompt}>
            <Text style={styles.logoutTitle}>Leave LUMIKIDS?</Text>
            <Text style={styles.logoutText}>Your offline progress is saved locally and will sync when a connection is available.</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutPrompt(false)}>
                <Text style={styles.cancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={logout}>
                <Text style={styles.confirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, width: "100%", maxWidth: 720, alignSelf: "center" },
  reconnect: { padding: 12, minHeight: 44, borderRadius: 12, marginBottom: 12, backgroundColor: "#FFFFFF" },
  reconnectText: { color: "#176BC1", fontWeight: "800" },

  logoutPrompt: { position: "absolute", left: 20, right: 20, bottom: 180, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, elevation: 1, borderWidth: 1, borderColor: "#E1E7E5", maxWidth: 680, alignSelf: "center" },

  logoutTitle: { fontSize: 20, fontWeight: "900", color: "#23394A" },

  logoutText: {
    marginTop: 6,
    color: "#64748B",
    lineHeight: 20,
  },

  logoutButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#EAF8FF",
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: "center",
  },

  cancelText: { color: "#275B8F", fontWeight: "800" },

  confirmButton: {
    flex: 1,
    backgroundColor: "#FFE4E4",
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: "center",
  },

  confirmText: { color: "#B91C1C", fontWeight: "800" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EAF7FF" },

  errorText: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  circle1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#39A9EC", opacity: 0.12, top: -110, right: -90 },

  circle2: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "#FFC84A", opacity: 0.14, left: -80, top: 340 },

  circle3: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "#19BCA2", opacity: 0.1, right: 40, bottom: 210 },

  circle4: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "#9B75DE", opacity: 0.1, left: 60, bottom: 120 },

  phygitalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#DBEAFE",
    elevation: 4,
  },
  phygitalEmoji: {
    fontSize: 34,
    marginRight: 13,
  },
  phygitalTextContainer: {
    flex: 1,
  },
  phygitalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1E3A8A",
  },
  phygitalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },
});
