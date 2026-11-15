import CelebrationText from "../../components/common/CelebrationText";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React from "react";
import { BackHandler, Text, StyleSheet, ScrollView, View } from "react-native";
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
    <LinearGradient colors={["#FAF8F2", "#FAF8F2"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>🎉 Lesson Complete!</Text>
          <Text style={styles.lesson}>Lesson {lessonId}</Text>
          <CelebrationText style={styles.stars}>{"⭐".repeat(stars)}</CelebrationText>
          <CelebrationText style={styles.reward}>✨ +{xp} XP</CelebrationText>
          <View style={styles.rewardRow}><CoinIcon size={28} /><CelebrationText style={styles.reward}>+{coins} Coins</CelebrationText></View>
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
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24, width: "100%", maxWidth: 620, alignSelf: "center" },
  title: { fontSize: 30, fontWeight: "900", color: "#23394A", textAlign: "center", lineHeight: 38 },
  lesson: { marginTop: 10, fontSize: 18, fontWeight: "700", color: "#5D7080" },
  stars: { fontSize: 48, marginVertical: 26 },
  rewardRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  reward: { marginLeft: 9, fontSize: 26, fontWeight: "800", color: "#23394A" },
  unlock: { marginTop: 25, fontSize: 18, color: "#237B67", fontWeight: "700", textAlign: "center", lineHeight: 26 },
  levelUp: { marginTop: 15, fontSize: 28, color: "#F59E0B", fontWeight: "900" },
  button: { marginTop: 40, backgroundColor: "#2867AD", paddingHorizontal: 45, paddingVertical: 18, borderRadius: 16, minHeight: 52, width: "100%", maxWidth: 360 },
  buttonText: { color: "white", fontSize: 19, fontWeight: "800" },
});
