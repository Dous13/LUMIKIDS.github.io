import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { mathLessons } from "../../data/mathLessons";

export default function MathScreen() {
  const navigation = useNavigation<any>();

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
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          data={mathLessons}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>

              <View style={styles.headerCard}>
                <Text style={styles.headerEmoji}>🔢</Text>

                <Text style={styles.title}>
                  Math Adventure
                </Text>

                <Text style={styles.subtitle}>
                  Learn numbers, counting and simple math through fun games!
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.lessonCard}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("MathLesson", {
                  lessonId: item.id,
                })
              }
            >
              <Text style={styles.emoji}>{item.emoji}</Text>

              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>
                  {item.title}
                </Text>

                <Text style={styles.lessonDescription}>
                  {item.description}
                </Text>
              </View>

              <View style={styles.xpBadge}>
                <Text style={styles.xpText}>
                  ⭐ {item.xpReward}
                </Text>
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

  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 60,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5A6C7D",
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  headerEmoji: {
    fontSize: 54,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#334155",
  },

  subtitle: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 15,
    marginTop: 8,
    lineHeight: 22,
  },

  lessonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  emoji: {
    fontSize: 50,
    marginRight: 18,
  },

  lessonTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
  },

  lessonDescription: {
    color: "#64748B",
    marginTop: 5,
    fontSize: 14,
  },

  xpBadge: {
    backgroundColor: "#FFE082",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  xpText: {
    fontWeight: "bold",
    color: "#6B5200",
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