import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Canvas, DashPathEffect, Path, Skia } from "@shopify/react-native-skia";
import {
  TracePoint,
  TraceStroke,
  validateTraceStroke,
} from "../../services/writing/tracingValidator";

import LetterGuide from "./LetterGuide";
import { writingStrokeTemplates } from "../../data/writingStrokeTemplates";

type Props = {
  target: string;
  resetKey: number;
  onPhaseComplete: (complete: boolean) => void;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
};

export default function TracingCanvas({
  target,
  resetKey,
  onPhaseComplete,
  onDrawingStart,
  onDrawingEnd,
}: Props) {
  const [strokes, setStrokes] = useState<TraceStroke[]>([]);
  const [letterIndex, setLetterIndex] = useState(0);
  const letterIndexRef = useRef(0);
  const letters = Array.from(target);
  const letter = letters[letterIndex] || "";
  const template = writingStrokeTemplates[letter];

  const [feedback, setFeedback] = useState("");
  const active = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const currentStroke = useRef<TraceStroke>([]);
  const strokesRef = useRef<TraceStroke[]>([]);
  const sizeRef = useRef(size);
  const targetRef = useRef(target);
  sizeRef.current = size;
  targetRef.current = target;
  const callbacks = useRef({ onPhaseComplete, onDrawingStart, onDrawingEnd });
  callbacks.current = { onPhaseComplete, onDrawingStart, onDrawingEnd };

  useEffect(() => {
    letterIndexRef.current = 0;
    setLetterIndex(0);
    currentStroke.current = [];
    strokesRef.current = [];
    setStrokes([]);
    active.current = false;
    setFeedback("");
    callbacks.current.onPhaseComplete(false);
    callbacks.current.onDrawingEnd?.();
  }, [resetKey, target, size.width, size.height]);

  useEffect(() => () => {
    active.current = false;
    callbacks.current.onDrawingEnd?.();
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const currentLetter = Array.from(targetRef.current)[letterIndexRef.current];
        const expected = writingStrokeTemplates[currentLetter];
        if (!expected || strokesRef.current.length === expected.length) return;
        active.current = true;
        callbacks.current.onDrawingStart?.();
        const point: TracePoint = {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        };
        currentStroke.current = [point];
        const next = [...strokesRef.current, [point]];
        strokesRef.current = next;
        setStrokes(next);
        callbacks.current.onPhaseComplete(false);
      },
      onPanResponderMove: (event) => {
        if (!active.current) return;
        const point: TracePoint = {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        };
        currentStroke.current = [...currentStroke.current, point];
        const next = [...strokesRef.current];
        next[next.length - 1] = currentStroke.current;
        strokesRef.current = next;
        setStrokes(next);
      },
      onPanResponderRelease: (event) => {
        if (!active.current) return;
        active.current = false;
        const attempt = [...currentStroke.current, {
          x: event.nativeEvent.locationX, y: event.nativeEvent.locationY,
        }];
        const accepted = strokesRef.current.slice(0, -1);
        const currentLetters = Array.from(targetRef.current);
        const currentLetter = currentLetters[letterIndexRef.current];
        const expected = writingStrokeTemplates[currentLetter];
        const valid = validateTraceStroke(
          currentLetter, attempt, accepted.length, sizeRef.current.width, sizeRef.current.height
        );
        if (valid) accepted.push(attempt);
        currentStroke.current = [];
        strokesRef.current = accepted;
        setStrokes(accepted);
        const letterComplete = valid && accepted.length === expected.length;
        const phaseComplete = letterComplete && letterIndexRef.current === currentLetters.length - 1;
        const remaining = expected.length - accepted.length;
        setFeedback(valid ? (letterComplete ? "Wonderful! You completed the letter!" :
          remaining === 1 ? "Great job! One more stroke!" : "Great job! Follow the next green number.") :
          "Let's try again! Start at the green number.");
        // A separate Continue control keeps the completed letter visible for review.
        callbacks.current.onPhaseComplete(phaseComplete);
        callbacks.current.onDrawingEnd?.();
      },
      onPanResponderTerminate: () => {
        if (active.current) {
          strokesRef.current = strokesRef.current.slice(0, -1);
          setStrokes(strokesRef.current);
        }
        active.current = false;
        currentStroke.current = [];
        callbacks.current.onDrawingEnd?.();
      },
    })
  ).current;

  const guidePaths = useMemo(
    () =>
      template
        ? template.map((stroke) => {
            const path = Skia.Path.Make();
            path.moveTo(stroke[0].x * size.width, stroke[0].y * size.height);
            stroke.slice(1).forEach(point => path.lineTo(point.x * size.width, point.y * size.height));
            return path;
          })
        : [],
    [template, size.width, size.height]
  );

  const completedCount = Math.max(0, strokes.length - (active.current ? 1 : 0));
  const letterComplete = !!template && completedCount === template.length;
  const currentGuide = template?.[completedCount];
  const start = currentGuide?.[0];
  const direction = currentGuide ? {
    x: (currentGuide[1].x - currentGuide[0].x) * size.width,
    y: (currentGuide[1].y - currentGuide[0].y) * size.height,
  } : { x: 0, y: 0 };
  const directionLength = Math.hypot(direction.x, direction.y) || 1;

  return (
    <View
      style={styles.touchLayer}
      onLayout={handleLayout}
    >
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      {!template ? <LetterGuide target={letter} /> : null}
      <Canvas style={{ width: size.width, height: size.height }} pointerEvents="none">
        {guidePaths.map((path, index) => (
          <Path
            key={`guide-${index}`}
            path={path}
            style="stroke"
            color={index < completedCount ? "#22A66A" : index === completedCount ? "#2998EF" : "#A9D8FA"}
            strokeWidth={18}
            strokeCap="round"
            strokeJoin="round"
          >
            {index >= completedCount ? <DashPathEffect intervals={[4, 22]} /> : null}
          </Path>
        ))}
        {strokes.map((stroke, index) => {
          if (stroke.length < 1) return null;
          const path = stroke.reduce((result, point, pointIndex) => {
            if (pointIndex === 0) result.moveTo(point.x, point.y);
            else result.lineTo(point.x, point.y);
            return result;
          }, Skia.Path.Make());
          return (
            <Path
              key={`user-${index}`}
              path={path}
              style="stroke"
              color={index < completedCount ? "#168452" : "#4DA8FF"}
              strokeWidth={12}
              strokeCap="round"
              strokeJoin="round"
            />
          );
        })}
      </Canvas>
      {start && size.width > 0 ? <>
        <View pointerEvents="none" style={[styles.startMarker, {
          left: start.x * size.width - 18, top: start.y * size.height - 18,
        }]}><Text style={styles.startNumber}>{completedCount + 1}</Text></View>
        <Text pointerEvents="none" style={[styles.directionArrow, {
          left: start.x * size.width + direction.x / directionLength * 46 - 18,
          top: start.y * size.height + direction.y / directionLength * 46 - 20,
        }]}>{strokeArrow(currentGuide, size.width, size.height)}</Text>
      </> : null}
      <Text pointerEvents="none" numberOfLines={1} style={[styles.wordProgress,
        letterComplete && letterIndex < letters.length - 1 && { right: 145 }]}>
        {letters.length > 1 ? `${letter} · ${letterIndex + 1}/${letters.length} in ${target} · ` : ""}
        {template ? (letterComplete ? `★ Wonderful, ${letter}! ★` :
          `Stroke ${completedCount + 1} of ${template.length}`) : letter}
      </Text>
      <Text pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.feedback, styles.preschoolFeedback]}>
        {template ? feedback || "Start at the green number. Follow the arrow!" : "This guide is not available yet."}
      </Text>
      </View>
      {template && !active.current && strokes.length === template.length && letterIndex < letters.length - 1 ?
        <TouchableOpacity accessibilityRole="button" style={styles.continueButton} onPress={() => {
          const currentLetter = Array.from(targetRef.current)[letterIndexRef.current];
          const expected = writingStrokeTemplates[currentLetter];
          if (active.current || !expected || strokesRef.current.length !== expected.length ||
              letterIndexRef.current >= Array.from(targetRef.current).length - 1) return;
          letterIndexRef.current += 1;
          setLetterIndex(letterIndexRef.current);
          currentStroke.current = [];
          strokesRef.current = [];
          setStrokes([]);
          setFeedback("");
          callbacks.current.onPhaseComplete(false);
          callbacks.current.onDrawingEnd?.();
        }}><Text style={styles.continueText}>Next letter →</Text></TouchableOpacity> : null}
    </View>
  );
}

function strokeArrow(stroke: TraceStroke, width: number, height: number): string {
  const dx = (stroke[1].x - stroke[0].x) * width, dy = (stroke[1].y - stroke[0].y) * height;
  const arrows = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
  return arrows[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
}

const styles = StyleSheet.create({
  startMarker: { position: "absolute", width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#168452", borderColor: "#FFFFFF", borderWidth: 3, alignItems: "center", justifyContent: "center" },
  startNumber: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", includeFontPadding: false },
  directionArrow: { position: "absolute", width: 36, height: 40, textAlign: "center", color: "#168452", fontSize: 32, fontWeight: "900", includeFontPadding: false },
  preschoolFeedback: { fontSize: 16, lineHeight: 20, color: "#176B47" },
  wordProgress: { position: "absolute", top: 8, left: 8, right: 8, textAlign: "center", fontWeight: "800", color: "#1E3A8A" },
  continueButton: { position: "absolute", top: 8, right: 10, padding: 10, backgroundColor: "#DBEAFE", borderRadius: 12 },
  continueText: { color: "#1E3A8A", fontWeight: "800" },
  feedback: { position: "absolute", bottom: 10, left: 12, right: 12, textAlign: "center", color: "#1E3A8A", fontWeight: "700" },
  touchLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
    zIndex: 10,
  },
});
