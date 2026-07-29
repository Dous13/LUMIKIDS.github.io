import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../types/navigation";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

const navigation = useNavigation<NavigationProp>();


export default function HomeScreen() {

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("studentSession");

            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome" }],
            });
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Greeting */}

        <Text style={styles.greeting}>
          🌞 Good Morning
        </Text>

        {/* Mascot */}

        <Image
          source={require("../../../assets/images/mascot.png")}
          style={styles.mascot}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Hi, Little Explorer!
        </Text>

        <Text style={styles.subtitle}>
          What would you like to learn today?
        </Text>

        {/* Reading */}

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.subject, { backgroundColor: "#6BD66B" }]}
        >
          <Text style={styles.subjectEmoji}>📖</Text>

          <Text style={styles.subjectTitle}>
            Reading
          </Text>
        </TouchableOpacity>

        {/* Writing */}

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.subject, { backgroundColor: "#FFB84D" }]}
        >
          <Text style={styles.subjectEmoji}>✏️</Text>

          <Text style={styles.subjectTitle}>
            Writing
          </Text>
        </TouchableOpacity>

        {/* Math */}

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.subject, { backgroundColor: "#58AEFF" }]}
        >
          <Text style={styles.subjectEmoji}>🔢</Text>

          <Text style={styles.subjectTitle}>
            Math
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Bar */}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          activeOpacity={0.7}
        >
          <Text style={styles.bottomEmoji}>🏠</Text>
          <Text style={styles.bottomText}>
            Home
          </Text>
        </TouchableOpacity>

        {/*<TouchableOpacity
          style={styles.bottomButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("ParentDashboard")}
        >
          <Text style={styles.bottomEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.bottomText}>
            Parent
          </Text>
        </TouchableOpacity>*/}

        <TouchableOpacity
          style={styles.bottomButton}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Text style={styles.bottomEmoji}>🚪</Text>
          <Text style={styles.bottomText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F3FAFF",
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 30,
  },

  greeting: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },

  mascot: {
    width: 170,
    height: 170,
    alignSelf: "center",
    marginTop: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#172554",
    textAlign: "center",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 18,
    color: "#64748B",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 40,
  },

  subject: {
    height: 120,
    borderRadius: 30,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 22,

    elevation: 5,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  subjectEmoji: {
    fontSize: 42,
  },

  subjectTitle: {
    marginTop: 10,
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },

  bottomBar: {

    height: 95,

    backgroundColor: "white",

    borderTopLeftRadius: 30,

    borderTopRightRadius: 30,

    flexDirection: "row",

    justifyContent: "space-evenly",

    alignItems: "center",

    elevation: 20,
  },

  bottomButton: {
    alignItems: "center",
  },

  bottomEmoji: {
    fontSize: 30,
  },

  bottomText: {
    marginTop: 6,
    fontWeight: "700",
    color: "#475569",
  },

});