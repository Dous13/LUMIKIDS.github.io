import TouchableOpacity from "../../components/common/MotionTouchable";
import FadeIn from "../../components/common/FadeIn";
import { Animated, View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useAmbientFloat } from "../../hooks/useAmbientFloat";
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
    color: "#FFDDC5",
    accent: Colors.reading,
  },
  {
    emoji: "✏️",
    title: "Writing",
    color: "#E4D4FF",
    accent: Colors.writing,
  },
  {
    emoji: "🔢",
    title: "Math",
    color: "#BDEDE1",
    accent: Colors.math,
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const drift = useAmbientFloat();

  return (
    <LinearGradient
      colors={["#EAF7FF", "#EAF7FF"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Decorations */}
        <Animated.View pointerEvents="none" accessible={false} style={[styles.circle1, { transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) }] }]} />
        <Animated.View pointerEvents="none" accessible={false} style={[styles.circle2, { transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }]} />
        <View pointerEvents="none" accessible={false} style={styles.circle3} />

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
                { backgroundColor: item.color, borderBottomColor: item.accent },
              ]}
            >
              <Text style={styles.subjectEmoji}>
                {item.emoji}
              </Text>

              <Text style={[styles.subjectTitle, { color: item.accent }]}>
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

  header: { alignItems: "center", marginTop: 20, paddingHorizontal: 8 },

  logoContainer: { width: 140, height: 140, borderRadius: 36, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", marginBottom: 16, ...Shadows.card, shadowColor: "#276891", shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: "#C5E1F4", borderBottomWidth: 4 },

  logo: { width: 120, height: 120 },

  welcome: { fontSize: 17, color: "#5D7080", fontWeight: "600", lineHeight: 24 },

  title: { fontSize: 40, fontWeight: "900", color: "#176BC1", letterSpacing: 1.5, lineHeight: 50 },

  subtitle: { marginTop: 10, fontSize: 16, textAlign: "center", color: "#5D7080", lineHeight: 24, paddingHorizontal: 26 },

  subjectContainer: { flexDirection: "row", justifyContent: "space-evenly", marginTop: 24, paddingHorizontal: 24, gap: 10 },

  subjectCard: { width: "auto", height: "auto", borderRadius: 20, justifyContent: "center", alignItems: "center", ...Shadows.card, flex: 1, minHeight: 104, paddingVertical: 16, elevation: 2, shadowOpacity: 0.06, borderWidth: 1, borderColor: "rgba(35,57,74,0.08)", borderBottomWidth: 4 },

  subjectEmoji: { fontSize: 30, textAlign: "center", textAlignVertical: "center", includeFontPadding: false },

  subjectTitle: { marginTop: 8, fontSize: 14, fontWeight: "700", color: "#23394A", lineHeight: 20 },

  footer: { flex: 0, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 8, paddingTop: 12, width: "100%", maxWidth: 440, alignSelf: "center" },

  teacher: { marginTop: 10, textAlign: "center", color: "#176BC1", fontWeight: "700", fontSize: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.72)", borderWidth: 1, borderColor: "#C5E1F4" },

  circle1: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "#39A9EC", top: -90, right: -80, display: "flex", opacity: 0.12 },

  circle2: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "#FFC84A", bottom: 160, left: -70, display: "flex", opacity: 0.14 },

  circle3: { position: "absolute", width: 64, height: 64, borderRadius: 32, backgroundColor: "#9B75DE", top: 220, right: 8, display: "flex", opacity: 0.08 },
});
