import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DashboardSummary } from "../../services/database/localDashboard";

type Props = {
  summary: DashboardSummary;
};

export default function StudentDashboard({ summary }: Props) {
  const accuracy =
    summary.quizAccuracy > 0 ? `${summary.quizAccuracy}%` : "—";

  return (
    <LinearGradient
      colors={["#FFF9DE", "#FFFFFF", "#E9F8FF"]}
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
          <Text style={styles.pillText}>🪙 {summary.coins}</Text>
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
  card: {
    borderRadius: 30,
    padding: 20,
    marginBottom: 22,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    elevation: 5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    color: "#334155",
  },
  sparkle: {
    fontSize: 24,
  },
  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 18,
    paddingVertical: 11,
  },
  statEmoji: {
    fontSize: 22,
  },
  statValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "900",
    color: "#2563EB",
  },
  statLabel: {
    marginTop: 1,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
  },
  subjectRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  subject: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 16,
    paddingVertical: 9,
  },
  subjectEmoji: {
    fontSize: 20,
  },
  subjectLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
  },
  subjectValue: {
    marginTop: 1,
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  pill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  practicePill: {
    backgroundColor: "#FFF1E6",
  },
  pillText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "800",
  },
});
