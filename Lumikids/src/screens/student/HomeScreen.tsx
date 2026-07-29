import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../types/navigation";

import HomeHeader from "../../components/home/HomeHeader";
import MascotCard from "../../components/home/MascotCard";
import SubjectButton from "../../components/home/SubjectButton";
import BottomMenu from "../../components/home/BottomMenu";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  async function logout() {
    Alert.alert(
      "Logout",
      "Do you want to logout?",
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
  <LinearGradient
    colors={["#F8FCFF", "#EAF8FF", "#D6F1FF"]}
    style={styles.container}
  >
    {/* Background Decorations */}

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
          name="Little Explorer"
        />

        <MascotCard />

        <SubjectButton
          emoji="📖"
          title="Reading"
          color="#EAF9F0"
          onPress={() =>
            Alert.alert("Reading", "Coming Soon!")
          }
        />

        <SubjectButton
          emoji="✏️"
          title="Writing"
          color="#FFF6E8"
          onPress={() =>
            Alert.alert("Writing", "Coming Soon!")
          }
        />

        <SubjectButton
          emoji="🔢"
          title="Math"
          color="#EDF6FF"
          onPress={() =>
            Alert.alert("Math", "Coming Soon!")
          }
        />
      </ScrollView>

      <BottomMenu
        xp={120}
        onParentPress={logout}
      />
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