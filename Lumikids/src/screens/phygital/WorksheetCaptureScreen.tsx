
import React, { useRef, useState } from "react";
import {
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
  type CameraViewRef,
} from "expo-camera";

import {
  analyzeWorksheet,
  type WorksheetAnalysis,
} from "../../services/phygital/worksheetAnalyzer";

import { Ionicons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../types/navigation";

export default function WorksheetCaptureScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "WorksheetCapture">
    >();

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysis, setAnalysis] =
    useState<WorksheetAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  async function captureAndAnalyze() {
    if (!cameraRef.current || !cameraReady || processing) {
      return;
    }

    setProcessing(true);
    setError(null);
    setAnalysis(null);

    try {
        const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        base64: true,
        });

      if (!photo?.uri || !photo.base64) {
        throw new Error("The camera did not return image data.");
      }

      setPhotoUri(photo.uri);

      // All image analysis happens locally on this device.
      const result = analyzeWorksheet(photo.base64);
      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not analyze the worksheet."
      );
    } finally {
      setProcessing(false);
    }
  }

  function retakePhoto() {
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
        Place the matching three-question worksheet in the frame.
        Keep the page flat and well lit.
      </Text>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
          />
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

      {analysis && (
        <View style={styles.results}>
          <Text style={styles.resultTitle}>Detected Answers</Text>


        {analysis.answers.map((answer, index) => {
          const status = analysis.statuses[index];

          let message: string;

          if (status === "blank") {
            message = "No answer detected";
          } else if (status === "ambiguous") {
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
            Experimental detection only. Check the photo and answers
            manually; this score is not a probability of correctness.
          </Text>

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
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 14,
    backgroundColor: "#F5F8FF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#173B75",
  },
  description: {
    fontSize: 15,
    color: "#53657D",
    lineHeight: 22,
  },
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
  button: {
    backgroundColor: "#246BFD",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  results: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#173B75",
  },
  answer: {
    fontSize: 17,
    color: "#24364B",
  },
  note: {
    fontSize: 13,
    color: "#69788B",
    lineHeight: 19,
  },
  error: {
    color: "#B42318",
    lineHeight: 21,
  },
  backButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "#E5EEFF",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 2,
},
});
