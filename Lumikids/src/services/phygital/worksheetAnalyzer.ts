
import { Buffer } from "buffer";
import jpeg from "jpeg-js";

if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

export type Answer = "A" | "B" | "C";

export type AnswerStatus =
  | "recognized"
  | "blank"
  | "ambiguous";

export interface WorksheetAnalysis {
  answers: (Answer | null)[];
  confidence: number[];
  statuses: AnswerStatus[];
  darkness: number[][];
  imageWidth: number;
  imageHeight: number;
}

type Bubble = {
  answer: Answer;
  x: number;
  y: number;
};

// Temporary coordinates for the current three-question prototype.
// These will be replaced with generated worksheet layout metadata.
const BUBBLES: Bubble[][] = [
  [
    { answer: "A", x: 0.30, y: 0.38 },
    { answer: "B", x: 0.50, y: 0.38 },
    { answer: "C", x: 0.70, y: 0.38 },
  ],
  [
    { answer: "A", x: 0.30, y: 0.53 },
    { answer: "B", x: 0.50, y: 0.53 },
    { answer: "C", x: 0.70, y: 0.53 },
  ],
  [
    { answer: "A", x: 0.30, y: 0.68 },
    { answer: "B", x: 0.50, y: 0.68 },
    { answer: "C", x: 0.70, y: 0.68 },
  ],
];

// Initial prototype thresholds only.
// These must be calibrated using actual generated worksheets.
const MIN_MARK_DARKNESS = 0.08;
const MIN_MARK_SEPARATION = 0.04;

function measureDarkness(
  pixels: Uint8Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number
): number {
  const radiusX = Math.max(2, Math.round(width * 0.012));
  const radiusY = Math.max(2, Math.round(height * 0.009));

  let darkPixels = 0;
  let totalPixels = 0;

  for (
    let y = Math.max(0, centerY - radiusY);
    y <= Math.min(height - 1, centerY + radiusY);
    y++
  ) {
    for (
      let x = Math.max(0, centerX - radiusX);
      x <= Math.min(width - 1, centerX + radiusX);
      x++
    ) {
      const index = (y * width + x) * 4;

      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];

      const gray =
        0.299 * red +
        0.587 * green +
        0.114 * blue;

      if (gray < 110) {
        darkPixels++;
      }

      totalPixels++;
    }
  }

  return totalPixels > 0
    ? darkPixels / totalPixels
    : 0;
}

export function analyzeWorksheet(
  base64Image: string
): WorksheetAnalysis {
  const imageBuffer = Buffer.from(base64Image, "base64");

  const image = jpeg.decode(imageBuffer, {
    useTArray: true,
  });

  const { width, height, data } = image;

  const answers: (Answer | null)[] = [];
  const confidence: number[] = [];
  const statuses: AnswerStatus[] = [];
  const allDarkness: number[][] = [];

  for (const question of BUBBLES) {
    const measurements = question.map((bubble) => ({
      answer: bubble.answer,
      darkness: measureDarkness(
        data,
        width,
        height,
        Math.round(bubble.x * width),
        Math.round(bubble.y * height)
      ),
    }));

    allDarkness.push(
      measurements.map((item) => item.darkness)
    );

    measurements.sort(
      (a, b) => b.darkness - a.darkness
    );

    const darkest = measurements[0];
    const secondDarkest = measurements[1];

    const separation =
      darkest.darkness - secondDarkest.darkness;

    // No bubble is sufficiently dark: treat as blank.
    if (darkest.darkness < MIN_MARK_DARKNESS) {
      answers.push(null);
      confidence.push(0);
      statuses.push("blank");
      continue;
    }

    // Two or more similarly dark bubbles: request clarification.
    if (separation < MIN_MARK_SEPARATION) {
      answers.push(null);
      confidence.push(0);
      statuses.push("ambiguous");
      continue;
    }

    answers.push(darkest.answer);

    // Relative separation score, not a probability of correctness.
    confidence.push(
      Math.max(0, Math.min(1, separation * 4))
    );

    statuses.push("recognized");
  }

  return {
    answers,
    confidence,
    statuses,
    darkness: allDarkness,
    imageWidth: width,
    imageHeight: height,
  };
}
