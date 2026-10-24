
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import {
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../types/navigation";
import { readingLessons } from "../../data/readingLessons";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PhygitalScan"
>;

export default function PhygitalScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState("");
  const [cameraError, setCameraError] = useState("");

  // Prevent the same QR code from being processed multiple times
  // before navigation finishes.
  const processed = useRef(false);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (processed.current) return;

    processed.current = true;
    setScanned(true);
    setMessage("");

    // Supported format: LUMIKIDS:READING:A
    const match = result.data
      .trim()
      .match(/^LUMIKIDS:READING:([A-Z])$/i);

    if (!match) {
      setMessage(
        "This card isn't recognized yet. Please scan a LUMIKIDS reading card."
      );
      return;
    }

    const lessonId = match[1].toUpperCase();

    const lesson = readingLessons.find(
      (item) => item.id.toUpperCase() === lessonId
    );

    if (!lesson) {
      setMessage(
        "We couldn't find a lesson for this card."
      );
      return;
    }

    // Open the existing lesson. Its normal quiz, progression,
    // reward, and local progress logic remains unchanged.
    navigation.replace("Lesson", {
      lessonId: lesson.id,
    });
  }

  function scanAgain() {
    processed.current = false;
    setScanned(false);
    setMessage("");
    setCameraError("");
  }

  return (
    <LinearGradient
      colors={["#62B8FF", "#A9DDFF", "#FFF3C4"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#2563EB"
            />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            📷 Scan a Learning Card
          </Text>

          <Text style={styles.subtitle}>
            Find a printed LUMIKIDS card and place its QR code
            inside the scanning frame.
          </Text>

          {!permission ? (
            <View style={styles.permissionCard}>
              <ActivityIndicator
                size="large"
                color="#2563EB"
              />
              <Text style={styles.statusText}>
                Checking camera permission...
              </Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionEmoji}>📸</Text>

              <Text style={styles.permissionTitle}>
                Camera access is needed
              </Text>

              <Text style={styles.permissionText}>
                Allow camera access so LUMIKIDS can recognize
                printed learning cards.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  void requestPermission();
                }}
              >
                <Text style={styles.primaryButtonText}>
                  Allow Camera
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.cameraFrame}>
                {isFocused ? (
                  <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                      barcodeTypes: ["qr"],
                    }}
                    onBarcodeScanned={
                      scanned
                        ? undefined
                        : handleBarcodeScanned
                    }
                    onMountError={(event) => {
                      setCameraError(event.message);
                    }}
                  />
                ) : (
                  <View style={styles.cameraPlaceholder} />
                )}

                <View
                  pointerEvents="none"
                  style={styles.scanOverlay}
                >
                  <View style={styles.scanFrame} />
                </View>
              </View>

              <Text style={styles.instruction}>
                Keep the QR code steady and well lit.
              </Text>

              {cameraError ? (
                <View style={styles.messageCard}>
                  <Text style={styles.messageText}>
                    Camera error: {cameraError}
                  </Text>
                </View>
              ) : null}

              {message ? (
                <View style={styles.messageCard}>
                  <Text style={styles.messageText}>
                    {message}
                  </Text>
                </View>
              ) : null}

              {scanned ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={scanAgain}
                >
                  <Text style={styles.primaryButtonText}>
                    Scan Another Card
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>
              💡 How it works
            </Text>
            <Text style={styles.tipText}>
              Scan a physical card to open its matching digital
              lesson. Your existing lesson system handles the
              quiz and progress tracking.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 3,
  },
  backText: {
    marginLeft: 7,
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "900",
  },
  title: {
    marginTop: 20,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    color: "#1E3A8A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#334155",
    textAlign: "center",
  },
  cameraFrame: {
    width: "100%",
    maxWidth: 520,
    height: 350,
    alignSelf: "center",
    marginTop: 22,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#172554",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    elevation: 6,
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: "#172554",
  },
    scanOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    },
  scanFrame: {
    width: 210,
    height: 210,
    borderWidth: 4,
    borderColor: "#86EFAC",
    borderRadius: 22,
    backgroundColor: "transparent",
  },
  instruction: {
    marginTop: 12,
    color: "#1E3A8A",
    fontWeight: "800",
    textAlign: "center",
  },
  permissionCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 24,
    alignItems: "center",
    elevation: 4,
  },
  permissionEmoji: {
    fontSize: 48,
  },
  permissionTitle: {
    marginTop: 12,
    fontSize: 21,
    fontWeight: "900",
    color: "#1E3A8A",
    textAlign: "center",
  },
  permissionText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
  },
  statusText: {
    marginTop: 12,
    color: "#475569",
    fontWeight: "700",
  },
  messageCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  messageText: {
    color: "#334155",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  tipCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1E3A8A",
  },
  tipText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
});
