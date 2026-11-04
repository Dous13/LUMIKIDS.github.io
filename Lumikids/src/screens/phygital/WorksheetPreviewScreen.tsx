
import React, { useState } from "react";
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

import { createWorksheet } from "../../data/phygitalWorksheets";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createWorksheetHtml(worksheet: GeneratedWorksheet): string {
  const tracingHtml = worksheet.tracing
  ? `
    <section class="tracing-section">
      <h2>1. Trace the uppercase letter</h2>
      <div class="trace-sample">
        ${escapeHtml(worksheet.tracing.uppercase)}
      </div>
      <div class="writing-lines"></div>

      <h2>2. Trace the lowercase letter</h2>
      <div class="trace-sample">
        ${escapeHtml(worksheet.tracing.lowercase)}
      </div>
      <div class="writing-lines"></div>

      <h2>3. Trace the word</h2>
      <div class="trace-word">
        ${escapeHtml(worksheet.tracing.word)}
      </div>
      <div class="writing-lines"></div>

      <div class="trace-picture">
        ${escapeHtml(worksheet.tracing.emoji)}
      </div>
      <p class="encouragement">Great work! Keep practicing!</p>
    </section>
  `
  : "";
  const questionsHtml = worksheet.questions
    .map(
      (question, index) => `
        <section class="question question-${index + 1}">
        
          <div class="question-number">QUESTION ${index + 1}</div>

          <div class="illustration">
            ${escapeHtml(question.illustration ?? "")}
          </div>

          <div class="prompt">
            ${escapeHtml(question.prompt)}
          </div>

          <div class="bubbles">
            ${question.choices
              .map(
                (choice) => `
                  <div class="choice">
                    <div class="bubble"></div>
                    <div class="choice-label">${choice.id}</div>
                    <div class="choice-text">
                      ${escapeHtml(choice.text)}
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #20334e;
          }

          .page {
            position: relative;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            background: #ffffff;
          }

          .header {
            position: absolute;
            top: 14mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
          }

          .brand {
            color: #246bce;
            font-size: 12pt;
            font-weight: bold;
            letter-spacing: 2px;
          }

          h1 {
            margin: 3mm 0 2mm;
            font-size: 23pt;
            color: #173b75;
          }

          .subtitle {
            font-size: 10pt;
            color: #53657d;
          }

          .student {
            position: absolute;
            top: 47mm;
            left: 16mm;
            right: 16mm;
            font-size: 10pt;
          }

          .student-line {
            display: inline-block;
            width: 75mm;
            border-bottom: 1px solid #52657d;
            height: 6mm;
          }

          .instruction {
            position: absolute;
            top: 62mm;
            left: 16mm;
            right: 16mm;
            padding: 3mm;
            border: 1px solid #bdd5f5;
            border-radius: 3mm;
            background: #f0f7ff;
            text-align: center;
            font-size: 10pt;
          }

          .question {
            position: absolute;
            left: 16mm;
            right: 16mm;
            height: 34mm;
            border: 1px solid #d5e2f2;
            border-radius: 4mm;
            padding: 3mm;
          }

          .question-1 { top: 77mm; }
          .question-2 { top: 114mm; }
          .question-3 { top: 151mm; }
          .question-4 { top: 188mm; }

          .bubbles {
            top: 22mm;
          }

          .footer {
            top: 238mm;
          }

          .illustration {
            position: absolute;
            top: 7mm;
            right: 7mm;
            font-size: 17pt;
            white-space: nowrap;
          }

          .prompt {
            position: absolute;
            top: 13mm;
            left: 4mm;
            right: 4mm;
            font-size: 11pt;
            font-weight: bold;
          }

          .bubbles {
            position: absolute;
            top: 27mm;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-evenly;
            align-items: center;
          }

          .choice {
            width: 33.333%;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2mm;
            font-size: 9pt;
          }

          .bubble {
            width: 7mm;
            height: 7mm;
            border: 1.2px solid #111111;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .choice-label {
            font-weight: bold;
          }

          .choice-text {
            max-width: 20mm;
            overflow-wrap: anywhere;
          }

          .footer {
            position: absolute;
            top: 225mm;
            left: 16mm;
            right: 16mm;
            text-align: center;
            font-size: 9pt;
            color: #53657d;
          }

          .worksheet-id {
            margin-top: 4mm;
            font-size: 8pt;
            color: #64748b;
          }

        .tracing-section {
          position: absolute;
          top: 68mm;
          left: 16mm;
          right: 16mm;
        }

        .tracing-section h2 {
          font-size: 13pt;
          color: #246bce;
          margin: 7mm 0 3mm;
        }

        .trace-sample {
          font-size: 48pt;
          font-weight: bold;
          color: #d3dce9;
          letter-spacing: 8mm;
          text-align: center;
          padding: 3mm;
        }

        .trace-word {
          font-size: 34pt;
          font-weight: bold;
          color: #d3dce9;
          letter-spacing: 3mm;
          text-align: center;
          padding: 4mm;
        }

        .writing-lines {
          height: 15mm;
          margin: 2mm 0 5mm;
          border-top: 1px dashed #8ba4c4;
          border-bottom: 1px solid #8ba4c4;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 7mm,
            #dce6f2 7mm,
            #dce6f2 7.2mm
          );
        }

        .trace-picture {
          font-size: 34pt;
          text-align: center;
          margin-top: 3mm;
        }

        .encouragement {
          text-align: center;
          color: #246bce;
          font-size: 12pt;
          font-weight: bold;
        }
        </style>
      </head>

      <body>
        <main class="page">
          <header class="header">
            <div class="brand">LUMIKIDS</div>
            <h1>${escapeHtml(worksheet.title)}</h1>
            <div class="subtitle">Learn • Play • Grow</div>
          </header>

          <div class="student">
            Name: <span class="student-line"></span>
          </div>

          <div class="instruction">
            ${
              worksheet.subject === "writing"
                ? "Trace the letters and word using your pencil."
                : "Look at each question. Fill in ONE bubble for your answer."
            }
          </div>

          ${worksheet.subject === "writing" ? tracingHtml : questionsHtml}

          <footer class="footer">
          ${worksheet.subject === "writing"
            ? "Great job! Keep practicing your letters."
            : "Great job! Check that you answered all the questions."}

            <div class="worksheet-id">
              Worksheet ID: ${escapeHtml(worksheet.id)}
            </div>
          </footer>
        </main>
      </body>
    </html>
  `;
}

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

    const worksheet = createWorksheet(subject, lessonId);

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

        <Text style={styles.heading}>Writing Worksheet</Text>

        <Text style={styles.noticeText}>
          Printable tracing worksheets will use handwriting recognition.
          That scanning feature is not connected yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

  async function printWorksheet() {
    try {
      setBusy(true);

      await Print.printAsync({
        html: createWorksheetHtml(worksheet),
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
        html: createWorksheetHtml(worksheet),
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
            })
          }
          disabled={busy}
        >
          <Ionicons name="scan-outline" size={21} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            Scan Completed Worksheet
          </Text>
        </TouchableOpacity>
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
            only one bubble per question using a pencil or dark pen.
          </Text>
        </View>

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
          Worksheet ID: {worksheet.id}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7FF",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 40,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 18,
  },

  backButtonText: {
    color: "#246BCE",
    fontWeight: "700",
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#244A86",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#52657D",
    marginBottom: 18,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#E2EEFF",
    marginBottom: 18,
  },

  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#244A86",
  },

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

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#246BCE",
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.6,
  },

  footer: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    marginTop: 18,
  },
});
