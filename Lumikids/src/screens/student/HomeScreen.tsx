import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getSession,
  clearSession,
} from "../../services/session/session";
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

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [studentId, setStudentId] = useState("");
  const [logoutPrompt, setLogoutPrompt] = useState(false);

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
    }, [reload])
  );

  async function logout() {
    await clearSession();
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
          color="#4DA8FF"
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
      colors={["#F8FCFF", "#EAF8FF", "#D6F1FF"]}
      style={styles.container}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      <View style={styles.circle4} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <HomeHeader
            name={student.name}
          />

          <MascotCard />

          <SubjectButton
            emoji="📖"
            title="Reading"
            color="#EAF9F0"
            onPress={() => navigation.navigate("Reading")}
          />

          <SubjectButton
            emoji="✏️"
            title="Writing"
            color="#FFF6E8"
            onPress={() =>
              navigation.navigate("Writing")
            }
          />

          <SubjectButton
            emoji="🔢"
            title="Math"
            color="#EDF6FF"
            onPress={() => navigation.navigate("Math")
            }
          />
        </ScrollView>
        <BottomMenu
          xp={student.xp}
          coins={student.coins}
          level={level}
          progress={progress}
          streak={student.streak}
          onShopPress={() => navigation.navigate("Shop")}
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

  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 60,
  },

  logoutPrompt: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 105,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    elevation: 10,
  },

  logoutTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#334155",
  },

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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FCFF",
  },

  errorText: {
    fontSize: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgb(116, 204, 153)",
    top: -110,
    right: -90,
  },

  circle2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgb(206, 184, 136)",
    left: -80,
    top: 340,
  },

  circle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgb(161, 228, 240)",
    right: 40,
    bottom: 210,
  },

  circle4: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgb(173, 134, 206)",
    left: 60,
    bottom: 120,
  },
});