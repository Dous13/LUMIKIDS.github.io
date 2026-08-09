import React, { useEffect, useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { Canvas, Path } from "@shopify/react-native-skia";

type Props = {
  resetKey: number;
  onDrawingChange: (hasDrawing: boolean) => void;
};

export default function TracingCanvas({ resetKey, onDrawingChange }: Props) {
  const [path, setPath] = useState("");
  const drawingRef = useRef(false);

  useEffect(() => {
    setPath("");
    drawingRef.current = false;
    onDrawingChange(false);
  }, [resetKey, onDrawingChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: event => {
        const { locationX, locationY } = event.nativeEvent;
        drawingRef.current = true;
        setPath(`M ${locationX} ${locationY}`);
        onDrawingChange(true);
      },
      onPanResponderMove: event => {
        const { locationX, locationY } = event.nativeEvent;
        setPath(current => `${current} L ${locationX} ${locationY}`);
      },
      onPanResponderRelease: () => {
        drawingRef.current = false;
      },
      onPanResponderTerminate: () => {
        drawingRef.current = false;
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {path ? (
          <Path
            path={path}
            style="stroke"
            color="#4DA8FF"
            strokeWidth={14}
            strokeCap="round"
            strokeJoin="round"
          />
        ) : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 250 },
});
