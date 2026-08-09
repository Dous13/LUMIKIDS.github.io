import React, { useEffect, useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";

type Point = { x: number; y: number };
type Stroke = Point[];

type Props = { resetKey: number; onDrawingChange: (hasDrawing: boolean) => void };

export default function TracingCanvas({ resetKey, onDrawingChange }: Props) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Stroke>([]);

  useEffect(() => {
    currentStroke.current = [];
    setStrokes([]);
    onDrawingChange(false);
  }, [resetKey, onDrawingChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: event => {
        const { locationX, locationY } = event.nativeEvent;
        const point = { x: locationX, y: locationY };
        currentStroke.current = [point];
        setStrokes(previous => [...previous, [point]]);
        onDrawingChange(true);
      },
      onPanResponderMove: event => {
        const { locationX, locationY } = event.nativeEvent;
        const point = { x: locationX, y: locationY };
        currentStroke.current = [...currentStroke.current, point];
        setStrokes(previous => {
          if (!previous.length) return [[point]];
          const next = [...previous];
          next[next.length - 1] = currentStroke.current;
          return next;
        });
      },
      onPanResponderRelease: () => {
        currentStroke.current = [];
      },
      onPanResponderTerminate: () => {
        currentStroke.current = [];
      },
    })
  ).current;

  return (
    <View style={styles.touchLayer} {...panResponder.panHandlers}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {strokes.map((stroke, index) => {
          if (!stroke.length) return null;
          const path = stroke.reduce((result, point, pointIndex) => {
            if (pointIndex === 0) result.moveTo(point.x, point.y);
            else result.lineTo(point.x, point.y);
            return result;
          }, Skia.Path.Make());
          return (
            <Path
              key={index}
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
  },
});
