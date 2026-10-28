
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
import { createMathWorksheet } from "../../data/phygitalWorksheets";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

const worksheet = createMathWorksheet([1, 2, 3]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createWorksheetHtml(): string {
  const questionsHtml = worksheet.questions
    .map(
      (question, index) => `
        <section class="question question-${index + 1}">
          <div class="question-number">QUESTION ${index + 1}</div>
          <div class="illustration">${escapeHtml(
            question.illustration ?? ""
          )}</div>
          <div class="prompt">${escapeHtml(question.prompt)}</div>
          <div class="bubbles">
            ${question.choices
              .map(
                (choice) => `
                  <div class="choice">
                    <div class="bubble"></div>
                    <div class="choice-label">${choice.id}</div>
                    <div class="choice-text">${escapeHtml(
                      choice.text
                    )}</div>
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
            height: 42mm;
            border: 1px solid #d5e2f2;
            border-radius: 4mm;
            padding: 4mm;
          }

          .question-1 { top: 77mm; }
          .question-2 { top: 121.5mm; }
          .question-3 { top: 166mm; }

          .question-number {
            font-size: 9pt;
            font-weight: bold;
            color: #246bce;
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
            Look at each question. Fill in ONE bubble for your answer.
          </div>

          ${questionsHtml}

          <footer class="footer">
            Great job! Check that you answered all three questions.
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

  const [busy, setBusy] = useState(false);


  async function printWorksheet() {
    try {
      setBusy(true);
      await Print.printAsync({
        html: createWorksheetHtml(),
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
        html: createWorksheetHtml(),
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
        style={[styles.primaryButton, busy && styles.disabled]}
        onPress={printWorksheet}
        disabled={busy}
        >
        <Ionicons name="print-outline" size={21} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Print Worksheet</Text>
        </TouchableOpacity>


        <Text style={styles.heading}>{worksheet.title}</Text>
        <Text style={styles.subtitle}>
          Printable worksheet • A4 portrait • 3 questions
        </Text>

        <View style={styles.notice}>
          <Ionicons name="information-circle" size={22} color="#246BCE" />
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
                <Text style={styles.choiceLabel}>{choice.id}.</Text>
                <Text style={styles.choiceText}>{choice.text}</Text>
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
              <Ionicons name="document-outline" size={22} color="#FFFFFF" />
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
  backText: {
    marginTop: 6,
    lineHeight: 20, 
    fontSize: 28,
    fontWeight: "900",
    color: "#2563EB",
  },
});
