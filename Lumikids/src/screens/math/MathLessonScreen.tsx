import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
<<<<<<< HEAD
  Alert,
=======
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
<<<<<<< HEAD
  RouteProp,
=======
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { mathLessons } from "../../data/mathLessons";
<<<<<<< HEAD
import { RootStackParamList } from "../../types/navigation";
import {
  getMathProgress,
} from "../../services/database/localMath";
import { getSession } from "../../services/session/session";

type Route = RouteProp<RootStackParamList, "MathLesson">;

export default function MathLessonScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const lessonId = route.params.lessonId;

  const lesson = mathLessons.find(l => l.id === lessonId);
  const [page, setPage] = useState(0);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Lesson not found.</Text>
      </SafeAreaView>
    );
  }

  const current = lesson.pages[page];
  const lastPage = page === lesson.pages.length - 1;

  async function startLesson() {
    const session = await getSession();

    if (session) {
      const progress = getMathProgress(session.studentId, lessonId);

      if (!progress?.unlocked) {
        Alert.alert(
          "🔒 Lesson Locked",
          "Finish the previous Math lesson first."
        );
        navigation.goBack();
        return;
      }
    }

    if (!lastPage) {
      setPage(previous => previous + 1);
      return;
    }

    navigation.replace("MathQuiz", { lessonId });
  }

  return (
    <LinearGradient
      colors={["#F8FCFF", "#EAF8FF", "#D6F1FF"]}
      style={styles.container}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{lesson.title}</Text>
            <Text style={styles.progress}>
              {page + 1} / {lesson.pages.length}
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  ((page + 1) / lesson.pages.length) * 100
                }%`,
              },
            ]}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.emoji}>{current.emoji}</Text>

          <View style={styles.numberBubble}>
            <Text style={styles.number}>{current.value}</Text>
          </View>

          <Text style={styles.title}>{current.title}</Text>
=======

export default function MathLessonScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const lessonId = route.params.lessonId;

  const lesson = mathLessons.find(
    (l) => l.id === lessonId
  );

  if (!lesson) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Lesson not found.</Text>
      </SafeAreaView>
    );
  }

  const [page, setPage] = useState(0);

  const current = lesson.pages[page];

  const lastPage =
    page === lesson.pages.length - 1;

  return (
    <LinearGradient
      colors={[
        "#F8FCFF",
        "#EAF8FF",
        "#D6F1FF",
      ]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>

    <View style={styles.header}>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.progress}>
        {page + 1} / {lesson.pages.length}
      </Text>

      {/* Spacer to keep the progress centered */}
      <View style={{ width: 48 }} />

    </View>

        <View style={styles.card}>

          <Text style={styles.emoji}>
            {current.emoji}
          </Text>

          <Text style={styles.number}>
            {current.value}
          </Text>

          <Text style={styles.title}>
            {current.title}
          </Text>
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2

          <Text style={styles.description}>
            {current.description}
          </Text>
<<<<<<< HEAD
=======

>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
        </View>

        <TouchableOpacity
          style={styles.button}
<<<<<<< HEAD
          activeOpacity={0.88}
          onPress={startLesson}
        >
          <Text style={styles.buttonText}>
            {lastPage ? "🧠 Start Quiz" : "Next ➜"}
          </Text>
        </TouchableOpacity>
=======
          onPress={() => {

            if (!lastPage) {
              setPage(page + 1);
              return;
            }

            navigation.replace(
              "MathQuiz",
              {
                lessonId,
              }
            );

          }}
        >
          <Text style={styles.buttonText}>
            {lastPage
              ? "Start Quiz ⭐"
              : "Next ➜"}
          </Text>
        </TouchableOpacity>

>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

<<<<<<< HEAD
  error: {
    fontSize: 20,
    fontWeight: "700",
    color: "#64748B",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  backArrow: {
    fontSize: 27,
    fontWeight: "800",
    color: "#4A90E2",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#334155",
  },

  progress: {
    marginTop: 2,
    color: "#64748B",
    fontWeight: "700",
  },

  headerSpacer: {
    width: 48,
  },

  progressTrack: {
    height: 12,
    backgroundColor: "#D7EAF8",
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 18,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#62C77A",
    borderRadius: 20,
  },

  card: {
    flex: 1,
    margin: 24,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    elevation: 6,
  },

  emoji: {
    fontSize: 58,
    textAlign: "center",
    lineHeight: 76,
  },

  numberBubble: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#EAF8FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },

  number: {
    fontSize: 58,
    fontWeight: "900",
    color: "#4A90E2",
  },

  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "900",
    color: "#334155",
    textAlign: "center",
  },

  description: {
    marginTop: 12,
    fontSize: 19,
    lineHeight: 28,
    color: "#64748B",
    textAlign: "center",
  },

  button: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: "#4DA8FF",
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 4,
=======
header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 24,
  paddingTop: 20,
},

  progress: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
  },

  card: {
    flex: 1,

    margin: 25,

    backgroundColor: "#FFFFFF",

    borderRadius: 30,

    justifyContent: "center",

    alignItems: "center",

    padding: 30,

    elevation: 5,
  },

  emoji: {
    fontSize: 70,
    textAlign: "center",
  },

  number: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#4A90E2",
    marginTop: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 20,
    color: "#334155",
    textAlign: "center",
  },

  description: {
    marginTop: 15,
    fontSize: 20,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 30,
  },

  button: {
    marginHorizontal: 25,
    marginBottom: 30,

    backgroundColor: "#4A90E2",

    borderRadius: 18,

    paddingVertical: 18,

    alignItems: "center",
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 22,
<<<<<<< HEAD
    fontWeight: "900",
  },

  circle1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#D7F9D4",
    top: -80,
    right: -80,
  },

  circle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFE8A3",
    left: -60,
    bottom: 80,
  },
});
=======
    fontWeight: "bold",
  },

backButton: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: "#FFFFFF",

  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: {
    width: 0,
    height: 4,
  },

  elevation: 5,
},

backArrow: {
  fontSize: 26,
  fontWeight: "bold",
  color: "#4A90E2",
},
});

>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2
