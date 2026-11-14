import { writingStrokeTemplates, writingTraceDefinitions } from "../../data/writingStrokeTemplates";
export type TracePoint = { x: number; y: number };
export type TraceStroke = TracePoint[];
export const UPPERCASE_A_STROKES = writingStrokeTemplates.A;
const distance = (a: TracePoint, b: TracePoint) => Math.hypot(a.x - b.x, a.y - b.y);
function length(points: TraceStroke): number {
  return points.slice(1).reduce((sum, p, i) => sum + distance(points[i], p), 0);
}
function signedArea(points: TraceStroke): number {
  return points.reduce((sum, p, i) => {
    const next = points[(i + 1) % points.length];
    return sum + p.x * next.y - next.x * p.y;
  }, 0) / 2;
}
function sample(points: TraceStroke, spacing: number): TraceStroke {
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const count = Math.max(1, Math.ceil(distance(a, b) / spacing));
    for (let j = 1; j <= count; j++) result.push({
      x: a.x + (b.x - a.x) * j / count, y: a.y + (b.y - a.y) * j / count,
    });
  }
  return result;
}
/** Ordered geometric matching: every portion of both paths must be covered in direction.
 * No font, network, model or raw-coordinate upload is involved.
 */
export function validateTraceStroke(
  letter: string, stroke: TraceStroke, index: number, width: number, height: number
): boolean {
  const template = writingStrokeTemplates[letter];
  if (!template || !Number.isInteger(index) || !template[index] ||
      !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 ||
      stroke.length < 2 || stroke.length > 4000 ||
      stroke.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return false;
  const expected = template[index].map(p => ({ x: p.x * width, y: p.y * height }));
  const config = writingTraceDefinitions[letter].validation;
  const guideLength = length(expected), actualLength = length(stroke);
  const tolerance = Math.min(Math.min(width, height) * config.tolerance, guideLength * .3);
  if (actualLength < guideLength * config.minimumLengthRatio || actualLength > guideLength * config.maximumLengthRatio ||
      distance(stroke[0], expected[0]) > tolerance ||
      distance(stroke[stroke.length - 1], expected[expected.length - 1]) > tolerance) return false;
  // Closed loops have identical endpoints. Preserve their winding direction even
  // for small dot circles whose diameter is comparable to the motor tolerance.
  if (distance(expected[0], expected[expected.length - 1]) < .001) {
    const expectedArea = signedArea(expected), actualArea = signedArea(stroke);
    if (Math.abs(expectedArea) > .001 &&
        (actualArea * expectedArea <= 0 || Math.abs(actualArea) < Math.abs(expectedArea) * .35)) return false;
  }
  // Resample by distance, not event count; stationary touches cannot supply coverage.
  const actual: TraceStroke = [stroke[0]];
  for (const p of stroke.slice(1)) {
    if (distance(actual[actual.length - 1], p) >= tolerance / 4) actual.push(p);
  }
  actual.push(stroke[stroke.length - 1]);
  const a = sample(actual, tolerance / 2), e = sample(expected, tolerance / 2);
  let previous = new Uint8Array(e.length);
  for (let i = 0; i < a.length; i++) {
    const row = new Uint8Array(e.length);
    for (let j = 0; j < e.length; j++) {
      if (distance(a[i], e[j]) <= tolerance &&
          ((i === 0 && j === 0) || previous[j] || (j > 0 && (row[j - 1] || previous[j - 1])))) row[j] = 1;
    }
    previous = row;
  }
  return previous[e.length - 1] === 1;
}
export function validateUppercaseAStroke(stroke: TraceStroke, index: number, width: number, height: number): boolean {
  return validateTraceStroke("A", stroke, index, width, height);
}
export function validateUppercaseA(strokes: TraceStroke[], width: number, height: number): boolean {
  return strokes.length === UPPERCASE_A_STROKES.length &&
    strokes.every((stroke, index) => validateUppercaseAStroke(stroke, index, width, height));
}
