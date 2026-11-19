import { Colors } from "../../theme";

import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import {
  analyzeWorksheet,
  type WorksheetAnalysis,
} from "../../services/phygital/worksheetAnalyzer";

import { Ionicons } from "@expo/vector-icons";

import {
  useIsFocused,
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

import { File, Paths } from "expo-file-system";
import { getSession } from "../../services/session/session";
import { getWorksheetRecord, saveWorksheetCapture } from "../../services/phygital/worksheetStore";
import type { GeneratedWorksheet } from "../../services/phygital/worksheetTypes";

export default function WorksheetCaptureScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "WorksheetCapture">
    >();

    const route =
      useRoute<RouteProp<RootStackParamList, "WorksheetCapture">>();

    const { subject, lessonId, instanceId } = route.params;
  const isFocused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [worksheet, setWorksheet] = useState<GeneratedWorksheet | null>(null);
  const captureLock = useRef(false);

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysis, setAnalysis] =
    useState<WorksheetAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string>();

  useEffect(() => {
    let active = true;
    getSession().then(session => {
      if (!active) return;
      if (!session?.studentId) throw new Error("Open your student account before scanning.");
      const record = getWorksheetRecord(session.studentId, instanceId);
      if (record.worksheet.subject !== subject || record.worksheet.lessonId !== String(lessonId)) throw new Error("The selected worksheet does not match this activity.");
      setWorksheet(record.worksheet);
    }).catch(error => { if (active) setError(error.message); });
    const subscription = AppState.addEventListener("change", state => { setForeground(state === "active"); setCameraReady(false); });
    return () => { active = false; subscription.remove(); };
  }, [instanceId, subject, lessonId]);

  useEffect(() => { if (!isFocused) setCameraReady(false); }, [isFocused]);

  async function prepareCamera() {
    try {
      const sizes = await cameraRef.current!.getAvailablePictureSizesAsync();
      const suitable = sizes.map(value => ({ value, sides: value.split("x").map(Number) }))
        .filter(s => Math.min(...s.sides) >= 1000 && s.sides[0] * s.sides[1] <= 6000000)
        .sort((a, b) => Math.abs(a.sides[0] * a.sides[1] - 2000000) - Math.abs(b.sides[0] * b.sides[1] - 2000000));
      setPictureSize(suitable[0]?.value);
      setCameraReady(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Camera could not initialize. Reopen the scanner."); }
  }

  async function captureAndAnalyze() {
    if (!cameraRef.current || !cameraReady || captureLock.current || !worksheet || !isFocused || !foreground) {
      return;
    }

    captureLock.current = true;
    setProcessing(true);
    setError(null);
    setAnalysis(null);

    try {
        const photo = await cameraRef.current.takePictureAsync({
        quality: 0.95,
        skipProcessing: false,
        imageType: "jpg",
        base64: true,
        });

      if (!photo?.uri || !photo.base64) {
        throw new Error("The camera did not return image data.");
      }

      setPhotoUri(photo.uri);

      // All image analysis happens locally on this device.
      const session = await getSession();
      if (!session || session.studentId !== worksheet.studentId) throw new Error("The student account changed. Reopen the worksheet in the correct account.");
      const result = analyzeWorksheet(photo.base64, worksheet);
      const savedPhoto = new File(Paths.document, "worksheet-" + instanceId + "-" + Date.now() + ".jpg");
      new File(photo.uri).copy(savedPhoto);
      saveWorksheetCapture(session.studentId, instanceId, result, savedPhoto.uri);
      setPhotoUri(savedPhoto.uri);
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not analyze the worksheet."
      );
    } finally {
      captureLock.current = false;
      setProcessing(false);
    }
  }

  function retakePhoto() {
    setCameraReady(false);
    setPhotoUri(null);
    setAnalysis(null);
    setError(null);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Worksheet Scanner</Text>
        <Text style={styles.description}>
          Camera access is required to capture a worksheet.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#173B75" />
      </Pressable>
      <Text style={styles.title}>Paper Activity Scanner</Text>

      <Text style={styles.description}>
        Subject: {subject.charAt(0).toUpperCase() + subject.slice(1)}
        {"\n"}
        Lesson ID: {lessonId}
      </Text>
      <Text style={styles.description}>
        Place the selected five-activity worksheet in the frame with all four black corner squares visible.
        Keep the page flat and well lit.
      </Text>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : (
        <View style={styles.cameraContainer}>
          {isFocused && foreground && worksheet ? <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            pictureSize={pictureSize}
            onCameraReady={prepareCamera}
            onMountError={event => { setError(event.message); setCameraReady(false); }}
          /> : null}
        </View>
      )}

      {!photoUri && (
        <TouchableOpacity
          style={[
            styles.button,
            (!cameraReady || processing) && styles.disabled,
          ]}
          disabled={!cameraReady || processing}
          onPress={captureAndAnalyze}
        >
          <Text style={styles.buttonText}>
            {cameraReady ? "Capture and Analyze" : "Starting Camera..."}
          </Text>
        </TouchableOpacity>
      )}

      {processing && <ActivityIndicator size="large" />}

      {error && <Text style={styles.error}>{error}</Text>}

      {photoUri && !analysis && <TouchableOpacity style={styles.button} onPress={retakePhoto} disabled={processing}>
        <Text style={styles.buttonText}>Retake Worksheet</Text>
      </TouchableOpacity>}
      {analysis && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>{worksheet?.tracing ? "Writing photo saved for teacher review" : "Detected Answers"}</Text>


        {analysis.answers.map((answer, index) => {
          const status = analysis.statuses[index];

          let message: string;

          if (status === "blank") {
            message = "No answer detected";
          } else if ((status === "ambiguous" || status === "multiple-marks")) {
            message = "Please check or remark your answer";
          } else {
            message = `Detected answer: ${answer}`;
          }

          return (
            <Text key={index} style={styles.answer}>
              Question {index + 1}: {message}
            </Text>
          );
        })}

          <Text style={styles.note}>
            Saved locally. A teacher must confirm all five activities before
            this worksheet affects progress. Recognition confidence is not a correctness score.
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("WorksheetReview", { studentId: worksheet!.studentId!, instanceId })}>
            <Text style={styles.buttonText}>Open Teacher Review</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={retakePhoto}
          >
            <Text style={styles.buttonText}>Retake Worksheet</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, gap: 14, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 14,
  },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  cameraContainer: {
    height: 430,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#152238",
  },
  camera: {
    flex: 1,
  },
  preview: {
    width: "100%",
    height: 430,
    resizeMode: "contain",
    backgroundColor: "#152238",
    borderRadius: 18,
  },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 16, alignItems: "center", minHeight: 52, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark, justifyContent: "center" },
  disabled: {
    opacity: 0.5,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: "800", textAlign: "center", lineHeight: 23 },
  results: { padding: 16, borderRadius: 16, backgroundColor: Colors.white, gap: 12, borderWidth: 1, borderColor: Colors.teacherBorder },
  resultTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  answer: { fontSize: 17, color: Colors.text },
  note: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  error: {
    color: "#B42318",
    lineHeight: 21,
  },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.teacherSurface, alignItems: "center", justifyContent: "center", marginBottom: 2 },
});
