import { writingStrokeTemplates, writingTraceDefinitions } from "../../data/writingStrokeTemplates";
export type TracePoint = { x: number; y: number };
export type TraceStroke = TracePoint[];
export const UPPERCASE_A_STROKES = writingStrokeTemplates.A;
const MAX_STROKE_POINTS = 4000;
const MAX_RESAMPLED_POINTS = 2048;
const MAX_COMPARISONS = 150_000;
export type TraceBudget = { points: number; comparisons: number };
export function isTraceCanvasSize(width: number, height: number) {
  return Number.isFinite(width) && Number.isFinite(height) &&
    Math.min(width, height) >= 1 && Math.max(width, height) <= 4096 &&
    Math.max(width, height) <= 6 * Math.min(width, height);
}
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
function sample(points: TraceStroke, spacing: number, limit: number): TraceStroke | null {
  if (limit < 1 || !Number.isFinite(spacing) || spacing <= 0) return null;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const count = Math.max(1, Math.ceil(distance(a, b) / spacing));
    if (!Number.isFinite(count) || result.length + count > limit) return null;
    for (let j = 1; j <= count; j++) result.push({
      x: a.x + (b.x - a.x) * j / count, y: a.y + (b.y - a.y) * j / count,
    });
  }
  return result;
}
/** Ordered geometric matching. Every portion of both paths must be covered in direction. */
export function validateTraceStroke(
  letter: string, stroke: TraceStroke, index: number, width: number, height: number, budget?: TraceBudget
): boolean {
  const template = writingStrokeTemplates[letter];
  if (!template || !Number.isInteger(index) || !template[index] ||
      !isTraceCanvasSize(width, height) || !Array.isArray(stroke) ||
      stroke.length < 2 || stroke.length > MAX_STROKE_POINTS ||
      stroke.some(p => !Number.isFinite(p?.x) || !Number.isFinite(p?.y) ||
        p.x < -width || p.x > width * 2 || p.y < -height || p.y > height * 2)) return false;
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
  const pointLimit = Math.min(MAX_RESAMPLED_POINTS, budget?.points ?? MAX_RESAMPLED_POINTS);
  const e = sample(expected, tolerance / 2, pointLimit);
  if (!e) return false;
  const comparisons = Math.min(MAX_COMPARISONS, budget?.comparisons ?? MAX_COMPARISONS);
  const a = sample(actual, tolerance / 2, Math.min(pointLimit - e.length, Math.floor(comparisons / e.length)));
  if (!a) return false;
  if (budget) {
    budget.points -= a.length + e.length;
    budget.comparisons -= a.length * e.length;
  }
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
