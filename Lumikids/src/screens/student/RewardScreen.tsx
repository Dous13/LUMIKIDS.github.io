import React from "react";
import { BackHandler, Text, StyleSheet, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../types/navigation";
import CoinIcon from "../../components/common/CoinIcon";

type RewardRouteProp = RouteProp<RootStackParamList, "Reward">;

export default function RewardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RewardRouteProp>();
  const { subject, lessonId, xp, coins, stars, unlocked, levelUp } = route.params;

  const continueToSubject = React.useCallback(() => {
    const screen = subject === "reading" ? "Reading" : subject === "writing" ? "Writing" : "Math";
    navigation.reset({ index: 1, routes: [{ name: "Home" }, { name: screen }] });
  }, [navigation, subject]);

  useFocusEffect(React.useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      continueToSubject();
      return true;
    });
    return () => sub.remove();
  }, [continueToSubject]));

  return (
    <LinearGradient colors={["#FFFDE7", "#E8F8FF"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>🎉 Lesson Complete!</Text>
          <Text style={styles.lesson}>Lesson {lessonId}</Text>
          <Text style={styles.stars}>{"⭐".repeat(stars)}</Text>
          <Text style={styles.reward}>✨ +{xp} XP</Text>
          <View style={styles.rewardRow}><CoinIcon size={28} /><Text style={styles.reward}>+{coins} Coins</Text></View>
          <Text style={styles.unlock}>{unlocked ? "🔓 New Lesson Unlocked!" : "🎉 Great Job!"}</Text>
          {levelUp && <Text style={styles.levelUp}>⬆ LEVEL UP!</Text>}
          <TouchableOpacity style={styles.button} onPress={continueToSubject}>
            <Text style={styles.buttonText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  title: { fontSize: 34, fontWeight: "900", color: "#2563EB", textAlign: "center" },
  lesson: { marginTop: 10, fontSize: 24, fontWeight: "700", color: "#475569" },
  stars: { fontSize: 60, marginVertical: 30 },
  rewardRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  reward: { marginLeft: 9, fontSize: 28, fontWeight: "700" },
  unlock: { marginTop: 25, fontSize: 22, color: "#16A34A", fontWeight: "700", textAlign: "center" },
  levelUp: { marginTop: 15, fontSize: 28, color: "#F59E0B", fontWeight: "900" },
  button: { marginTop: 40, backgroundColor: "#4DA8FF", paddingHorizontal: 45, paddingVertical: 18, borderRadius: 20 },
  buttonText: { color: "white", fontSize: 22, fontWeight: "800" },
});
