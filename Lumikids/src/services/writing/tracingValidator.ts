export type TracePoint = { x: number; y: number };
export type TraceStroke = TracePoint[];

/**
 * First offline tracing template: uppercase A, in normalized 0..1 coordinates.
 * Stroke order: left diagonal (bottom -> top), right diagonal (top -> bottom),
 * crossbar (left -> right).
 */
export const UPPERCASE_A_STROKES: TracePoint[][] = [
  [{ x: 0.25, y: 0.80 }, { x: 0.50, y: 0.18 }],
  [{ x: 0.50, y: 0.18 }, { x: 0.75, y: 0.80 }],
  [{ x: 0.36, y: 0.55 }, { x: 0.64, y: 0.55 }],
];

function distance(a: TracePoint, b: TracePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegmentDistance(
  point: TracePoint,
  start: TracePoint,
  end: TracePoint
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(point, start);

  const projection = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)
  );
  return distance(point, {
    x: start.x + projection * dx,
    y: start.y + projection * dy,
  });
}

function isExpectedPathCovered(
  expected: TracePoint[],
  actual: TracePoint[],
  tolerance: number
): boolean {
  if (actual.length < 2 || expected.length < 2) return false;

  // Direction matters: the child must begin and end near the guide's endpoints.
  if (
    distance(actual[0], expected[0]) > tolerance * 1.6 ||
    distance(actual[actual.length - 1], expected[expected.length - 1]) > tolerance * 1.6
  ) {
    return false;
  }

  // Sample the guide and ensure the child's stroke passes close to every sample.
  const [start, end] = expected;
  const samples = 32;
  for (let i = 0; i <= samples; i += 1) {
    const ratio = i / samples;
    const sample = {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
    };

    let nearest = Number.POSITIVE_INFINITY;
    for (let j = 0; j < actual.length - 1; j += 1) {
      nearest = Math.min(nearest, pointToSegmentDistance(sample, actual[j], actual[j + 1]));
    }
    if (nearest > tolerance) return false;
  }

  return true;
}

/** Returns true only when all three uppercase-A strokes are traced in order. */
export function validateUppercaseA(
  strokes: TraceStroke[],
  width: number,
  height: number
): boolean {
  if (width <= 0 || height <= 0 || strokes.length !== UPPERCASE_A_STROKES.length) {
    return false;
  }

  const scale = Math.min(width, height);
  // Allow normal motor variation while still requiring the trace to follow the guide.
  const tolerance = scale * 0.055;

  const expectedInPixels = UPPERCASE_A_STROKES.map((stroke) =>
    stroke.map((point) => ({ x: point.x * width, y: point.y * height }))
  );

  return expectedInPixels.every((expected, index) =>
    isExpectedPathCovered(expected, strokes[index], tolerance)
  );
}
