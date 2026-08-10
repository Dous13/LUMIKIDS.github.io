import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { getSession } from "../../services/session/session";
import { getDashboardSummary, DashboardSummary } from "../../services/database/localDashboard";
import StudentDashboard from "../../components/home/StudentDashboard";
import { getLocalStudent } from "../../services/database/localStudent";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Dashboard">;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [studentName, setStudentName] = useState("Explorer");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      async function loadDashboard() {
        setLoading(true);
        const session = await getSession();

        if (!session) {
          navigation.reset({
            index: 0,
            routes: [{ name: "Welcome" }],
          });
          return;
        }

        const student = getLocalStudent(session.studentId);
        const data = getDashboardSummary(session.studentId);

        if (active) {
          setStudentName(student?.name ?? "Explorer");
          setSummary(data);
          setLoading(false);
        }
      }

      loadDashboard();

      return () => {
        active = false;
      };
    }, [navigation])
  );

  return (
    <LinearGradient
      colors={["#62B8FF", "#A9DDFF", "#FFF3C4"]}
      style={styles.container}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>📊 My Dashboard</Text>
            <Text style={styles.subtitle}>
              See how your learning adventure is going, {studentName}!
            </Text>
          </View>
        </View>

        {loading || !summary ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading your adventure...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <StudentDashboard summary={summary} />

            <LinearGradient
              colors={["#FFFFFF", "#F1FAFF"]}
              style={styles.tipCard}
            >
              <Text style={styles.tipEmoji}>🌟</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Keep exploring!</Text>
                <Text style={styles.tipText}>
                  Every lesson you finish and every mistake you learn from helps you grow.
                </Text>
              </View>
            </LinearGradient>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  backText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#2563EB",
  },
  headerText: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#334155",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontWeight: "800",
  },
  tipCard: {
    marginTop: 2,
    borderRadius: 26,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    elevation: 4,
  },
  tipEmoji: { fontSize: 38, marginRight: 14 },
  tipContent: { flex: 1 },
  tipTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#334155",
  },
  tipText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    fontWeight: "600",
  },
  circle1: {
    position: "absolute", width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(116, 204, 153, 0.35)", top: -100, right: -80,
  },
  circle2: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(173, 134, 206, 0.25)", bottom: 40, left: -80,
  },
});
