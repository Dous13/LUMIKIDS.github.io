import { Colors } from "../../theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DashboardSummary } from "../../services/database/localDashboard";
import CoinIcon from "../common/CoinIcon";

type Props = {
  summary: DashboardSummary;
};

export default function StudentDashboard({ summary }: Props) {
  const accuracy =
    summary.quizAccuracy > 0 ? `${summary.quizAccuracy}%` : "—";

  return (
    <LinearGradient
      colors={[Colors.white, Colors.white]}
      style={styles.card}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>📊 My Learning Adventure</Text>
        <Text style={styles.sparkle}>✨</Text>
      </View>

      <Text style={styles.subtitle}>
        Here's how you're doing so far!
      </Text>

      <View style={styles.statsRow}>
        <Stat emoji="⭐" value={String(summary.totalStars)} label="Stars" />
        <Stat emoji="📚" value={String(summary.completedLessons)} label="Lessons" />
        <Stat emoji="🎯" value={accuracy} label="Quiz accuracy" />
      </View>

      <View style={styles.subjectRow}>
        <SubjectProgress emoji="📖" label="Reading" value={summary.readingCompleted} />
        <SubjectProgress emoji="✏️" label="Writing" value={summary.writingCompleted} />
        <SubjectProgress emoji="🔢" label="Math" value={summary.mathCompleted} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>⚡ {summary.xp} XP</Text>
        </View>
        <View style={styles.pill}>
          <CoinIcon size={18} />
          <Text style={styles.pillText}> {summary.coins}</Text>
        </View>
        <View style={[styles.pill, summary.mistakes > 0 && styles.practicePill]}>
          <Text style={styles.pillText}>
            {summary.mistakes > 0
              ? `💪 ${summary.mistakes} practice mistakes`
              : "🌟 No mistakes yet!"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function Stat({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SubjectProgress({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.subject}>
      <Text style={styles.subjectEmoji}>{emoji}</Text>
      <Text style={styles.subjectLabel}>{label}</Text>
      <Text style={styles.subjectValue}>{value} done</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, marginBottom: 22, borderWidth: 1, borderColor: Colors.border, elevation: 2, backgroundColor: Colors.white, borderBottomWidth: 3, shadowColor: Colors.text, shadowOpacity: 0.05, shadowRadius: 6 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "800", color: Colors.text, flex: 1, lineHeight: 28 },
  sparkle: { fontSize: 24, display: "none" },
  subtitle: { marginTop: 4, color: Colors.textSecondary, fontWeight: "500", lineHeight: 23 },
  statsRow: { flexDirection: "row", marginTop: 16, gap: 8, flexWrap: "wrap" },
  stat: { flex: 1, alignItems: "center", backgroundColor: Colors.rewardSurface, borderRadius: 12, paddingVertical: 11, flexBasis: "28%", minWidth: 80, paddingHorizontal: 6 },
  statEmoji: { fontSize: 22, textAlign: "center", includeFontPadding: false },
  statValue: { marginTop: 2, fontSize: 26, fontWeight: "800", color: Colors.text, lineHeight: 34 },
  statLabel: { marginTop: 1, fontSize: 13, color: Colors.textSecondary, fontWeight: "600", textAlign: "center", lineHeight: 18 },
  subjectRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  subject: { flex: 1, alignItems: "center", backgroundColor: "#E0F2FF", borderRadius: 12, paddingVertical: 9, flexBasis: "28%", minWidth: 80, paddingHorizontal: 6 },
  subjectEmoji: { fontSize: 20, textAlign: "center", includeFontPadding: false },
  subjectLabel: { marginTop: 2, fontSize: 13, fontWeight: "700", color: Colors.textSecondary, lineHeight: 19 },
  subjectValue: { marginTop: 1, fontSize: 13, color: Colors.textSecondary, fontWeight: "600", lineHeight: 19 },
  bottomRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  pill: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  practicePill: {
    backgroundColor: "#FFF1E6",
  },
  pillText: { fontSize: 13, color: "#475569", fontWeight: "700", lineHeight: 19 },
});
