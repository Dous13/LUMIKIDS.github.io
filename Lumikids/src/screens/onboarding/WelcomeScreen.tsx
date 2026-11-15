import TouchableOpacity from "../../components/common/MotionTouchable";
import FadeIn from "../../components/common/FadeIn";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import PrimaryButton from "../../components/buttons/PrimaryButton";

import { RootStackParamList } from "../../types/navigation";
import {
  Colors,
  Spacing,
  Typography,
  Radius,
  Shadows,
} from "../../theme";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const SUBJECTS = [
  {
    emoji: "📖",
    title: "Reading",
    color: "#FFF1E6",
  },
  {
    emoji: "✏️",
    title: "Writing",
    color: "#F1EDFB",
  },
  {
    emoji: "🔢",
    title: "Math",
    color: "#E8F4F0",
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient
      colors={["#FAF8F2", "#FAF8F2"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Decorations */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* HEADER */}
        <FadeIn style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/images/welcomeicon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.welcome}>Welcome to</Text>

          <Text style={styles.title}>LUMIKIDS</Text>

          <Text style={styles.subtitle}>
            Learn, play and discover through fun adventures!
          </Text>
        </FadeIn>

        {/* SUBJECTS */}
        <View style={styles.subjectContainer}>
          {SUBJECTS.map((item) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.8}
              style={[
                styles.subjectCard,
                { backgroundColor: item.color },
              ]}
            >
              <Text style={styles.subjectEmoji}>
                {item.emoji}
              </Text>

              <Text style={styles.subjectTitle}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <PrimaryButton
            title="Let's Start! →"
            onPress={() =>
              navigation.navigate("StudentLogin")
            }
          />

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TeacherLogin")
            }
          >
            <Text style={styles.teacher}>
              Teacher Portal
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, width: "100%", maxWidth: 620, alignSelf: "center", paddingBottom: 24 },
  container: {
    flex: 1,
  },

  header: { alignItems: "center", marginTop: 24, paddingHorizontal: 8 },

  logoContainer: { width: 128, height: 128, borderRadius: 32, backgroundColor: "transparent", justifyContent: "center", alignItems: "center", marginBottom: 16, ...Shadows.card, shadowColor: "#7CCBFF", shadowOpacity: 0, shadowRadius: 18, elevation: 0 },

  logo: { width: 120, height: 120 },

  welcome: { fontSize: 18, color: "#5D7080", fontWeight: "600" },

  title: { fontSize: 40, fontWeight: "900", color: "#2867AD", letterSpacing: 2, lineHeight: 52 },

  subtitle: { marginTop: 10, fontSize: 17, textAlign: "center", color: "#5D7080", lineHeight: 26, paddingHorizontal: 30 },

  subjectContainer: { flexDirection: "row", justifyContent: "space-evenly", marginTop: 28, paddingHorizontal: 24, gap: 10 },

  subjectCard: { width: "auto", height: "auto", borderRadius: 18, justifyContent: "center", alignItems: "center", ...Shadows.card, flex: 1, minHeight: 100, paddingVertical: 16, elevation: 0, shadowOpacity: 0 },

  subjectEmoji: { fontSize: 30 },

  subjectTitle: { marginTop: 10, fontSize: 13, fontWeight: "700", color: "#23394A" },

  footer: { flex: 0, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 8, paddingTop: 14 },

  teacher: { marginTop: 10, textAlign: "center", color: "#2867AD", fontWeight: "700", fontSize: 16, paddingVertical: 12 },

  circle1: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(255,255,255,0.25)", top: -90, right: -80, display: "none" },

  circle2: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.18)", bottom: 160, left: -70, display: "none" },

  circle3: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.2)", top: 250, right: 40, display: "none" },
});