import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
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
    color: "#E8F5E9",
  },
  {
    emoji: "✏️",
    title: "Writing",
    color: "#FFF3E0",
  },
  {
    emoji: "🔢",
    title: "Math",
    color: "#E3F2FD",
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient
      colors={["#EAF8FF", "#D7F1FF", "#C6E8FF"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Decorations */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* HEADER */}
        <View style={styles.header}>
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
        </View>

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
            title="🚀 Let's Start!"
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
              👩‍🏫 Teacher Portal
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    alignItems: "center",
    marginTop: 20,
  },

  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 20,

    ...Shadows.card,

    shadowColor: "#7CCBFF",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },

  logo: {
    width: 90,
    height: 90,
  },

  welcome: {
    fontSize: 22,
    color: "#4B5563",
    fontWeight: "600",
  },

  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#2E7DFF",
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 17,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 26,
    paddingHorizontal: 30,
  },

  subjectContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 45,
    paddingHorizontal: 18,
  },

  subjectCard: {
    width: 95,
    height: 120,

    borderRadius: 28,

    justifyContent: "center",
    alignItems: "center",

    ...Shadows.card,
  },

  subjectEmoji: {
    fontSize: 42,
  },

  subjectTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },

  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  teacher: {
    marginTop: 18,
    textAlign: "center",
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 16,
  },

  circle1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.25)",
    top: -90,
    right: -80,
  },

  circle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.18)",
    bottom: 160,
    left: -70,
  },

  circle3: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    top: 250,
    right: 40,
  },
});