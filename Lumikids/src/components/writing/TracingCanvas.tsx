import React from "react";
import {
  Canvas,
  Line,
} from "@shopify/react-native-skia";

export default function TracingCanvas() {
  return (
    <Canvas style={{ flex: 1 }}>
      <Line
        p1={{ x: 100, y: 100 }}
        p2={{ x: 300, y: 300 }}
        color="red"
        strokeWidth={8}
      />
    </Canvas>
  );
}