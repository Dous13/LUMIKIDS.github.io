import { Colors } from "../../theme";

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";

import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { GeneratedWorksheet } from "../../services/phygital/worksheetTypes";
import type { RootStackParamList } from "../../types/navigation";

import { createWorksheetHtml } from "../../services/phygital/worksheetPrint";
import { issueWorksheet, getWorksheetHistory } from "../../services/phygital/worksheetStore";
import { getSession } from "../../services/session/session";
import * as Crypto from "expo-crypto";

export default function WorksheetPreviewScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<
        RootStackParamList,
        "WorksheetPreview"
      >
    >();

  const route =
    useRoute<RouteProp<RootStackParamList, "WorksheetPreview">>();

    const { subject, lessonId } = route.params;

  const [worksheet, setWorksheet] = useState<GeneratedWorksheet | null>(null);
  const [studentId, setStudentId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [copies, setCopies] = useState<GeneratedWorksheet[]>([]);
  useEffect(() => {
    let active = true;
    getSession().then(session => {
      if (!active) return;
      if (!session?.studentId) throw new Error("Please open your student account first.");
      setStudentId(session.studentId);
      const prior = getWorksheetHistory(session.studentId).map(r => r.worksheet)
        .filter(w => w.subject === subject && w.lessonId === String(lessonId));
      const current = prior[0] ?? issueWorksheet(session.studentId, subject, lessonId, Crypto.randomUUID());
      setCopies(prior.length ? prior : [current]); setWorksheet(current);
    }).catch(error => { if (active) setLoadError(error.message); });
    return () => { active = false; };
  }, [subject, lessonId]);

  const [busy, setBusy] = useState(false);

  if (!worksheet) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={21} color="#246BCE" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Preparing Worksheet</Text>

        <Text style={styles.noticeText}>
          {loadError || "Loading your saved worksheet copy..."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

  async function createNewCopy() {
    try {
      const session = await getSession();
      if (session?.studentId !== studentId) throw new Error("Reopen the worksheet in the correct student account.");
      const next = issueWorksheet(studentId, subject, lessonId, Crypto.randomUUID());
      setWorksheet(next); setCopies(previous => [next, ...previous]);
    } catch (error) { Alert.alert("Cannot create worksheet", error instanceof Error ? error.message : "Please try again."); }
  }

  async function printWorksheet() {
    try {
      setBusy(true);

      await Print.printAsync({
        html: createWorksheetHtml(worksheet!),
      });
    } catch (error) {
      Alert.alert(
        "Print unavailable",
        error instanceof Error
          ? error.message
          : "Unable to open the print dialog."
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveOrSharePdf() {
    try {
      setBusy(true);

      const file = await Print.printToFileAsync({
        html: createWorksheetHtml(worksheet!),
      });

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert(
          "PDF created",
          `The PDF was created at: ${file.uri}`
        );
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save or share LUMIKIDS worksheet",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      Alert.alert(
        "PDF export failed",
        error instanceof Error
          ? error.message
          : "Unable to generate the worksheet PDF."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={21} color="#246BCE" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            busy && styles.disabled,
          ]}
          onPress={() =>
            navigation.navigate("WorksheetCapture", {
              subject,
              lessonId,
              instanceId: worksheet.instanceId!,
            })
          }
          disabled={busy}
        >
          <Ionicons name="scan-outline" size={21} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            Scan Completed Worksheet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={createNewCopy}><Text style={styles.primaryButtonText}>Create a New Copy</Text></TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("WorksheetReview", { studentId })}>
          <Text style={styles.backButtonText}>Worksheet history / teacher review</Text>
        </TouchableOpacity>
        {copies.length > 1 && copies.map(copy => <TouchableOpacity key={copy.instanceId} style={styles.backButton} onPress={() => setWorksheet(copy)}>
          <Text style={styles.backButtonText}>{copy.instanceId === worksheet.instanceId ? "Selected: " : "Use copy: "}{copy.instanceId?.slice(0, 8)}</Text>
        </TouchableOpacity>)}
        <Text style={styles.heading}>{worksheet.title}</Text>

        <Text style={styles.subtitle}>
          Printable worksheet • A4 portrait •{" "}
          {worksheet.subject === "writing"
            ? "Letter tracing"
            : `${worksheet.questions.length} questions`}
        </Text>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle"
            size={22}
            color="#246BCE"
          />

          <Text style={styles.noticeText}>
            Print the page at its original size. The child should fill
            only one bubble per question using a pencil or dark pen. Writing
            activities are checked manually by a teacher. Keep all corner squares visible.
          </Text>
        </View>

        {worksheet.tracing?.activities.map((activity, i) => <View key={activity.id} style={styles.card}>
          <Text style={styles.questionNumber}>ACTIVITY {i + 1}</Text><Text style={styles.prompt}>{activity.prompt}</Text>
          <Text style={styles.illustration}>{activity.target}</Text>
        </View>)}
        {worksheet.questions.map((question, index) => (
          <View key={question.id} style={styles.card}>
            <Text style={styles.questionNumber}>
              QUESTION {index + 1}
            </Text>

            <Text style={styles.illustration}>
              {question.illustration}
            </Text>

            <Text style={styles.prompt}>{question.prompt}</Text>

            {question.choices.map((choice) => (
              <View key={choice.id} style={styles.choice}>
                <View style={styles.bubble} />

                <Text style={styles.choiceLabel}>
                  {choice.id}.
                </Text>

                <Text style={styles.choiceText}>
                  {choice.text}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={[styles.primaryButton, busy && styles.disabled]} onPress={printWorksheet} disabled={busy}>
          <Text style={styles.primaryButtonText}>Print Worksheet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, busy && styles.disabled]}
          onPress={saveOrSharePdf}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="document-outline"
                size={22}
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                Save / Share Printable PDF
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Worksheet ID: {worksheet.id}{"\n"}Copy: {worksheet.instanceId}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  content: {
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 40,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 18,
  },

  backButtonText: { color: Colors.primary, fontWeight: "700" },

  heading: { fontSize: 26, fontWeight: "800", color: Colors.text, marginBottom: 8 },

  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 18, lineHeight: 21 },

  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, backgroundColor: Colors.rewardSurface, marginBottom: 18 },

  noticeText: { flex: 1, fontSize: 15, lineHeight: 22, color: Colors.rewardText },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DCE8F8",
  },

  questionNumber: {
    color: "#5277B8",
    fontSize: 13,
    fontWeight: "800",
  },

  illustration: {
    fontSize: 28,
    marginTop: 8,
  },

  prompt: {
    fontSize: 17,
    fontWeight: "700",
    color: "#25354D",
    marginTop: 8,
    marginBottom: 12,
  },

  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 9,
    minHeight: 28,
  },

  bubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#25354D",
  },

  choiceLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#5277B8",
  },

  choiceText: {
    flex: 1,
    fontSize: 16,
    color: "#25354D",
  },

  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, padding: 16, borderRadius: 16, marginTop: 8, minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },

  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: "800", lineHeight: 23, textAlign: "center", flexShrink: 1 },

  disabled: {
    opacity: 0.6,
  },

  footer: { textAlign: "center", color: Colors.textSecondary, fontSize: 13, marginTop: 18, lineHeight: 20 },
});
