import React from "react";
import {
  StyleSheet,
  View,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { writingLessons } from "../../data/writingLessons";
import LetterGuide from "../../components/writing/LetterGuide";
import TracingCanvas from "../../components/writing/TracingCanvas";
import TracingButtons from "../../components/writing/TracingButtons";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

export default function TraceLetterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { lessonId } = route.params;

  const lesson = writingLessons.find(
    l => l.id === lessonId
  );

  if (!lesson) {
    return null;
  }

  return (
    <LinearGradient
    colors={["#CFEFFF", "#EAFBFF", "#FFF9E8"]}
    style={{ flex: 1 }}
    >
    <View style={styles.circle1}/>
    <View style={styles.circle2}/>
    <View style={styles.circle3}/>
    <SafeAreaView style={styles.container}>
    <TouchableOpacity
    style={styles.backButton}
    onPress={() => navigation.goBack()}
    >
    <Ionicons
        name="arrow-back"
        size={28}
        color="#2563EB"
    />

    <Text style={styles.backText}>
        Back
    </Text>
    </TouchableOpacity>
      <Text style={styles.title}>
        ✏️ Trace the Letter!
      </Text>

      <Text style={styles.subtitle}>
        Can you trace the letter {lesson.letter}?
      </Text>

      <View style={styles.canvasContainer}>

        <LetterGuide
          letter={lesson.letter}
        />

        <TracingCanvas />

      </View>

      <TracingButtons
        onClear={() => {
          console.log("Clear");
        }}
        onNext={() => {
          console.log("Next");
        }}
      />

    </SafeAreaView>
</LinearGradient>
  );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F8FBFF",
        padding: 20,
    },

    title: {
        fontSize: 34,
        fontWeight: "800",
        textAlign: "center",
    },

    subtitle: {
        marginTop: 10,
        textAlign: "center",
        color: "#64748B",
        fontSize: 18,
        marginBottom: 25,
    },

    canvasContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 35,
        padding: 15,
        elevation: 8,
        overflow: "hidden",
    },

    backButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",

        backgroundColor: "white",

        paddingHorizontal: 18,
        paddingVertical: 12,

        borderRadius: 30,

        elevation: 5,
    },

    backText: {
        marginLeft: 8,
        fontSize: 18,
        fontWeight: "700",
        color: "#2563EB",
    },

    circle1: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "#BDEBFF",
        top: -80,
        right: -60,
    },

    circle2: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "#FFE6A7",
        bottom: 120,
        left: -40,
    },

    circle3: {
        position: "absolute",
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#C8F7C5",
        bottom: 300,
        right: 40,
    },
});