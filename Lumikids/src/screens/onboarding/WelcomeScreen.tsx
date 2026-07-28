import { View, Text, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import PrimaryButton from "../../components/buttons/PrimaryButton";

import { RootStackParamList } from "../../types/navigation";
import { Colors, Spacing, Typography } from "../../theme";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();

return (
  <View style={styles.container}>

    {/* Decorative Circles */}
    <View style={styles.circleTop} />
    <View style={styles.circleBottom} />

    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/images/welcomeicon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        Welcome to{"\n"}
        <Text style={styles.logo}>LUMIKIDS</Text>
      </Text>

      <Text style={styles.subtitle}>
        Learn through fun games, exciting challenges,
        and interactive adventures!
      </Text>
    </View>

    {/* Subjects */}
    <View style={styles.subjectContainer}>

      <View style={styles.subjectCard}>
        <Text style={styles.subjectEmoji}>📗</Text>
        <Text style={styles.subjectTitle}>Reading</Text>
      </View>

      <View style={styles.subjectCard}>
        <Text style={styles.subjectEmoji}>✏️</Text>
        <Text style={styles.subjectTitle}>Writing</Text>
      </View>

      <View style={styles.subjectCard}>
        <Text style={styles.subjectEmoji}>🔢</Text>
        <Text style={styles.subjectTitle}>Math</Text>
      </View>

    </View>

    <PrimaryButton
      title="🚀 Start Learning"
      onPress={() => navigation.navigate("RoleSelection")}
    />

    <Text
      style={styles.teacher}
      onPress={() => navigation.navigate("TeacherLogin")}
    >
      👩‍🏫 Teacher Portal
    </Text>

  </View>
);
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5FAFF",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

header: {
  alignItems: "center",
  marginTop: 10,
},

logoContainer: {
  width: 140,
  height: 140,
  borderRadius: 70,
  backgroundColor: "#FFFFFF",
  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#74B9FF",
  shadowOpacity: 0.25,
  shadowRadius: 20,
  shadowOffset: {
    width: 0,
    height: 8,
  },

  elevation: 10,

  marginBottom: 24,
},

logo: {
  width: 90,
  height: 90,
},

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

subtitle: {
  marginTop: 14,
  fontSize: 17,
  textAlign: "center",
  color: "#64748B",
  lineHeight: 26,
  paddingHorizontal: 20,
},

  illustration: {
    height: 260,
    borderRadius: 24,
    backgroundColor: "#EEF5FF",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholder: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
  },

teacher: {
  marginTop: 24,
  textAlign: "center",
  fontWeight: "600",
  color: "#3B82F6",
  fontSize: 16,
},


  circleTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#DCEEFF",
    top: -120,
    right: -90,
},

circleBottom: {
  position: "absolute",
  width: 220,
  height: 220,
  borderRadius: 110,
  backgroundColor: "#EAF7FF",
  bottom: -80,
  left: -80,
},

subjectContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginVertical: 30,
},

subjectCard: {
  flex: 1,
  backgroundColor: "#FFFFFF",

  marginHorizontal: 6,

  borderRadius: 22,

  paddingVertical: 22,

  alignItems: "center",

  shadowColor: "#000",

  shadowOpacity: 0.08,

  shadowRadius: 10,

  shadowOffset: {
    width: 0,
    height: 4,
  },

  elevation: 4,
},

subjectEmoji: {
  fontSize: 34,
},

subjectTitle: {
  marginTop: 10,
  fontSize: 15,
  fontWeight: "700",
  color: "#334155",
},
});