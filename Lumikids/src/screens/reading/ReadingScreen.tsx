import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const lessons = [
  {
    id: "1",
    title: "Letter A",
    word: "Apple",
    emoji: "🍎",
    color: "#CFF7D4",
    unlocked: true,
  },
  {
    id: "2",
    title: "Letter B",
    word: "Ball",
    emoji: "⚽",
    color: "#FFE6C7",
    unlocked: false,
  },
  {
    id: "3",
    title: "Letter C",
    word: "Cat",
    emoji: "🐱",
    color: "#DDEEFF",
    unlocked: false,
  },
];

export default function ReadingScreen() {
  const navigation = useNavigation<any>();

  return (
    <LinearGradient
      colors={["#F8FCFF", "#EAF8FF", "#D8F4FF"]}
      style={styles.container}
    >
    <SafeAreaView style={{ flex: 1 }}>


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
          Home
        </Text>
      </TouchableOpacity>

        <Text style={styles.title}>
          🌈 Reading Adventure
        </Text>

        <Text style={styles.subtitle}>
          🦉 Let's learn a new letter!
        </Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            ⭐ Reading Progress
          </Text>

          <Text style={styles.progressText}>
            1 of 26 Letters Completed
          </Text>

          <View style={styles.progressBackground}>
            <View style={styles.progressFill}/>
          </View>
        </View>

        <FlatList
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          data={lessons}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!item.unlocked}
              style={[
                styles.lessonCard,
                {
                  backgroundColor: item.color,
                  opacity: item.unlocked ? 1 : 0.55,
                },
              ]}
              onPress={() =>
                navigation.navigate("Lesson", {
                  lessonId: item.id,
                })
              }
            >

              <Text style={styles.lessonEmoji}>
                {item.emoji}
              </Text>

              <View style={{ flex: 1 }}>

                <Text style={styles.lessonTitle}>
                  {item.title}
                </Text>

                <Text style={styles.lessonWord}>
                  {item.word}
                </Text>

                {item.unlocked ? (
                  <View style={styles.startButton}>
                    <Text style={styles.startText}>
                      START
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.locked}>
                    🔒 Complete previous lesson
                  </Text>
                )}

              </View>

            </TouchableOpacity>

          )}
        />

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1E3A8A",
    textAlign: "center",
    marginTop: 20,
  },

  subtitle: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 18,
    marginTop: 10,
  },

  progressCard: {
    marginHorizontal: 20,
    marginTop: 25,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 20,

    elevation: 4,
  },

  progressTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },

  progressText: {
    marginTop: 8,
    color: "#64748B",
  },

  progressBackground: {
    marginTop: 16,
    height: 12,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    width: "20%",
    height: "100%",
    backgroundColor: "#57C36A",
    borderRadius: 20,
  },

  lessonCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,

    flexDirection: "row",
    alignItems: "center",

    elevation: 5,
  },

  lessonEmoji: {
    fontSize: 60,
    marginRight: 22,
  },

  lessonTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },

  lessonWord: {
    marginTop: 6,
    fontSize: 18,
    color: "#475569",
  },

  startButton: {
    marginTop: 16,
    alignSelf: "flex-start",

    backgroundColor: "#4DA8FF",

    paddingHorizontal: 22,
    paddingVertical: 10,

    borderRadius: 16,
  },

  startText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  locked: {
    marginTop: 18,
    color: "#64748B",
    fontWeight: "600",
  },

  backButton: {
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "white",
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderRadius: 30,
  marginBottom: 5,
  elevation: 4,
  marginLeft: 15,
  },

  backText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
  },

});