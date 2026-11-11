import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import {
  TracePoint,
  TraceStroke,
  UPPERCASE_A_STROKES,
  validateUppercaseA,
} from "../../services/writing/tracingValidator";

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
    currentStroke.current = [];
    strokesRef.current = [];
    setStrokes([]);
    callbacks.current.onPhaseComplete(false);
  }, [resetKey]);

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
      onPanResponderRelease: () => {
        currentStroke.current = [];
        const complete =
          targetRef.current === "A" &&
          validateUppercaseA(strokesRef.current, sizeRef.current.width, sizeRef.current.height);
        callbacks.current.onPhaseComplete(complete);
        callbacks.current.onDrawingEnd?.();
      },
      onPanResponderTerminate: () => {
        currentStroke.current = [];
        callbacks.current.onPhaseComplete(false);
        callbacks.current.onDrawingEnd?.();
      },
    })
  ).current;

  const guidePaths = useMemo(
    () =>
      target === "A"
        ? UPPERCASE_A_STROKES.map((stroke) => {
            const path = Skia.Path.Make();
            path.moveTo(stroke[0].x * size.width, stroke[0].y * size.height);
            path.lineTo(stroke[1].x * size.width, stroke[1].y * size.height);
            return path;
          })
        : [],
    [target, size.width, size.height]
  );

  return (
    <View
      style={styles.touchLayer}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {guidePaths.map((path, index) => (
          <Path
            key={`guide-${index}`}
            path={path}
            style="stroke"
            color="#DDE7F0"
            strokeWidth={22}
            strokeCap="round"
            strokeJoin="round"
          />
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
              color="#4DA8FF"
              strokeWidth={12}
              strokeCap="round"
              strokeJoin="round"
            />
          );
        })}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 10,
  },
});
