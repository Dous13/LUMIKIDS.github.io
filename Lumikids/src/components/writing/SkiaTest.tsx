import React from "react";
import { Canvas, Circle } from "@shopify/react-native-skia";

export default function SkiaTest() {
  return (
    <Canvas style={{ flex: 1 }}>
      <Circle
        cx={150}
        cy={150}
        r={80}
        color="red"
      />
    </Canvas>
  );
}