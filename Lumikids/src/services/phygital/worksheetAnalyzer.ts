import { Buffer } from "buffer";
import jpeg from "jpeg-js";
import type { GeneratedWorksheet, WorksheetAnswer, WorksheetResponseStatus } from "./worksheetTypes";
import { WORKSHEET_LAYOUT as L, worksheetIdentityBits } from "./worksheetLayout";

export interface WorksheetAnalysis {
  capturedAt?: string;
  worksheetInstanceId: string;
  answers: (WorksheetAnswer | null)[];
  confidence: number[];
  statuses: WorksheetResponseStatus[];
  darkness: number[][];
  imageWidth: number;
  imageHeight: number;
  validated: true;
  quality: { paperBrightness: number; edgeSharpness: number };
}
export type Point = { x: number; y: number };

// Solve a projective mapping rather than assuming that the camera is centered.
export function projectiveMap(from: readonly Point[], to: readonly Point[]) {
  const matrix: number[][] = [];
  from.forEach((p, i) => {
    const q = to[i];
    matrix.push([p.x, p.y, 1, 0, 0, 0, -q.x * p.x, -q.x * p.y, q.x]);
    matrix.push([0, 0, 0, p.x, p.y, 1, -q.y * p.x, -q.y * p.y, q.y]);
  });
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let row = col + 1; row < 8; row++) if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) pivot = row;
    [matrix[col], matrix[pivot]] = [matrix[pivot], matrix[col]];
    const divisor = matrix[col][col];
    if (Math.abs(divisor) < 1e-9) throw new Error("Page alignment is unclear. Retake with all four squares visible.");
    for (let j = col; j <= 8; j++) matrix[col][j] /= divisor;
    for (let row = 0; row < 8; row++) if (row !== col) {
      const factor = matrix[row][col];
      for (let j = col; j <= 8; j++) matrix[row][j] -= factor * matrix[col][j];
    }
  }
  const h = matrix.map(row => row[8]);
  return (p: Point): Point => {
    const denominator = h[6] * p.x + h[7] * p.y + 1;
    return { x: (h[0] * p.x + h[1] * p.y + h[2]) / denominator,
      y: (h[3] * p.x + h[4] * p.y + h[5]) / denominator };
  };
}

function markerCenters(gray: Uint8Array, width: number, height: number, threshold: number): Point[] {
  const visited = new Uint8Array(gray.length), candidates: (Point & { size: number })[] = [];
  const queue = new Int32Array(gray.length);
  for (let start = 0; start < gray.length; start++) {
    if (visited[start] || gray[start] > threshold) continue;
    let head = 0, tail = 1, minX = width, minY = height, maxX = 0, maxY = 0;
    queue[0] = start; visited[start] = 1;
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (const next of [x > 0 ? index - 1 : -1, x + 1 < width ? index + 1 : -1,
        y > 0 ? index - width : -1, y + 1 < height ? index + width : -1]) {
        if (next >= 0 && !visited[next] && gray[next] <= threshold) { visited[next] = 1; queue[tail++] = next; }
      }
    }
    const w = maxX - minX + 1, h = maxY - minY + 1;
    if (w >= 8 && h >= 8 && w < width * .08 && h < height * .08 && w / h > .6 && w / h < 1.65 && tail / (w * h) > .58) {
      candidates.push({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, size: Math.sqrt(tail) });
    }
  }
  const scores = [(p: Point) => p.x / width + p.y / height,
    (p: Point) => 1 - p.x / width + p.y / height,
    (p: Point) => 2 - p.x / width - p.y / height,
    (p: Point) => p.x / width + 1 - p.y / height];
  const points = scores.map(score => [...candidates].sort((a, b) => score(a) - score(b))[0]);
  if (points.some(p => !p) || new Set(points).size !== 4 ||
      Math.max(...points.map(p => p.size)) / Math.min(...points.map(p => p.size)) > 2 ||
      points[1].x - points[0].x < width * .32 || points[3].y - points[0].y < height * .32) {
    throw new Error("Cannot find the complete page. Show all four black corner squares against a plain background.");
  }
  return points;
}

export function analyzeWorksheet(base64Image: string, worksheet: GeneratedWorksheet): WorksheetAnalysis {
  const expectedBits = worksheetIdentityBits(worksheet);
  const decoded = jpeg.decode(Buffer.from(base64Image, "base64"), {
    useTArray: true, maxResolutionInMP: 20, maxMemoryUsageInMB: 192,
  });
  if (Math.min(decoded.width, decoded.height) < 600) throw new Error("The photo is too small. Move closer while keeping the entire page visible.");
  // Bound the processing buffers independently of camera resolution.
  const scale = Math.min(1, 1500 / Math.max(decoded.width, decoded.height));
  const width = Math.round(decoded.width * scale), height = Math.round(decoded.height * scale);
  const gray = new Uint8Array(width * height), histogram = new Uint32Array(256);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (Math.min(decoded.height - 1, Math.floor(y / scale)) * decoded.width + Math.min(decoded.width - 1, Math.floor(x / scale))) * 4;
    const value = Math.round(.299 * decoded.data[i] + .587 * decoded.data[i + 1] + .114 * decoded.data[i + 2]);
    gray[y * width + x] = value; histogram[value]++;
  }
  let cumulative = 0, paper = 255;
  for (let i = 0; i < 256; i++) { cumulative += histogram[i]; if (cumulative >= gray.length * .9) { paper = i; break; } }
  if (paper < 130) throw new Error("The photo is too dark. Add even lighting and retake.");
  if (histogram[255] / gray.length > .9998) throw new Error("The photo is washed out. Reduce glare and retake.");
  const threshold = Math.min(145, paper * .55);
  const markers = markerCenters(gray, width, height, threshold);
  const map = projectiveMap(L.markers, markers);
  const sampleImage = (p: Point) => {
    const x = Math.round(p.x), y = Math.round(p.y);
    if (x < 0 || y < 0 || x >= width || y >= height) throw new Error("Part of the worksheet is cut off. Retake the whole page.");
    return gray[y * width + x];
  };
  const sample = (x: number, y: number) => sampleImage(map({ x, y }));
  for (const p of [{ x: 0, y: 0 }, { x: L.width, y: 0 }, { x: L.width, y: L.height }, { x: 0, y: L.height }]) {
    const q = map(p);
    if (q.x < 1 || q.y < 1 || q.x >= width - 1 || q.y >= height - 1) throw new Error("Part of the worksheet is cut off. Leave a small border around the entire page.");
  }
  let contrast = 0, edges = 0;
  for (const p of L.markers) for (const direction of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
    const edge = map({ x: p.x + direction.x * L.markerSize / 2, y: p.y + direction.y * L.markerSize / 2 });
    const center = map(p), dx = edge.x - center.x, dy = edge.y - center.y, length = Math.hypot(dx, dy);
    contrast += Math.abs(sampleImage({ x: edge.x + dx / length, y: edge.y + dy / length }) -
      sampleImage({ x: edge.x - dx / length, y: edge.y - dy / length })); edges++;
  }
  const edgeSharpness = contrast / edges;
  if (edgeSharpness < 70) throw new Error("The photo is blurry. Hold the camera steady, focus on the page and retake.");
  const observed = expectedBits.map((_, i) => {
    const x = L.code.x + (i % L.code.columns + .5) * L.code.cell;
    const y = L.code.y + (Math.floor(i / L.code.columns) + .5) * L.code.cell;
    const value = (sample(x, y) + sample(x - .25, y) + sample(x + .25, y)) / 3;
    if (Math.abs(value - threshold) < 25) throw new Error("The worksheet code is unclear. Reduce shadows or glare and retake.");
    return value < threshold ? 1 : 0;
  });
  if (observed.some((bit, i) => bit !== expectedBits[i])) throw new Error("This is not the selected worksheet copy, student or template. Select the matching copy or print a new worksheet.");
  const answers: (WorksheetAnswer | null)[] = [], confidence: number[] = [], statuses: WorksheetResponseStatus[] = [], darkness: number[][] = [];
  for (const question of worksheet.questions) {
    const positions = worksheet.bubbleLayout?.positions.filter(p => p.questionId === question.id);
    if (!positions || positions.length !== 3) throw new Error("Worksheet answer regions are missing. Print a new worksheet.");
    const scores = positions.map(position => {
      const cx = position.x * L.width, cy = position.y * L.height;
      let total = 0, dark = 0, background = 0;
      for (let i = 0; i < 12; i++) background += sample(cx + Math.cos(i * Math.PI / 6) * 4.6, cy + Math.sin(i * Math.PI / 6) * 4.6);
      background /= 12;
      if (background < 120) throw new Error("A shadow covers the answers. Light the page evenly and retake.");
      for (let dy = -2.1; dy <= 2.1; dy += .35) for (let dx = -2.1; dx <= 2.1; dx += .35) if (dx * dx + dy * dy < 4.5) {
        if (sample(cx + dx, cy + dy) < background * .64) dark++;
        total++;
      }
      return dark / total;
    });
    darkness.push(scores);
    const ranked = scores.map((score, i) => ({ score, answer: positions[i].answer })).sort((a, b) => b.score - a.score);
    const top = ranked[0].score, second = ranked[1].score, separation = top - second;
    if (top < .06) { answers.push(null); statuses.push("blank"); confidence.push(0); }
    else if (second >= .22) { answers.push(null); statuses.push("multiple-marks"); confidence.push(0); }
    else if (top < .22 || second > .08 || separation < .16) { answers.push(null); statuses.push("ambiguous"); confidence.push(0); }
    else { answers.push(ranked[0].answer); statuses.push("recognized"); confidence.push(Math.min(1, separation)); }
  }
  return { worksheetInstanceId: worksheet.instanceId!, validated: true, answers, confidence, statuses, darkness,
    imageWidth: width, imageHeight: height, quality: { paperBrightness: paper, edgeSharpness } };
}
