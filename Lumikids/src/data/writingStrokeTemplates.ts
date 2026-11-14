// Local manuscript centerlines. Array order and point order define stroke order/direction.
// Curves are sampled into the same polylines used for both drawing and assessment.
type Point = { x: number; y: number };
type Stroke = Point[];
const line = (...xy: number[]): Stroke => Array.from({ length: xy.length / 2 }, (_, i) => ({ x: xy[i * 2], y: xy[i * 2 + 1] }));
const arc = (cx: number, cy: number, rx: number, ry: number, start: number, end: number): Stroke =>
  Array.from({ length: 33 }, (_, i) => {
    const angle = (start + (end - start) * i / 32) * Math.PI / 180;
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
const oval = () => arc(50, 70, 30, 30, 0, -360);
const raw: Record<string, Stroke[]> = {
  A: [line(0,100,50,0), line(50,0,100,100), line(22,60,78,60)],
  B: [line(15,0,15,100), [...arc(15,25,70,25,-90,90), ...arc(15,75,75,25,-90,90)]],
  C: [arc(55,50,45,50,-45,-315)],
  D: [line(15,0,15,100), arc(15,50,75,50,-90,90)],
  E: [line(15,0,15,100), line(15,0,85,0), line(15,50,70,50), line(15,100,85,100)],
  F: [line(15,0,15,100), line(15,0,85,0), line(15,50,70,50)],
  G: [arc(55,50,45,50,-45,-315), line(85,85,85,55,55,55)],
  H: [line(10,0,10,100), line(90,0,90,100), line(10,50,90,50)],
  I: [line(50,0,50,100), line(15,0,85,0), line(15,100,85,100)],
  J: [line(20,0,85,0), [ ...line(75,0,75,75), ...arc(45,75,30,25,0,180)]],
  K: [line(15,0,15,100), line(85,0,15,55,90,100)],
  L: [line(15,0,15,100,90,100)],
  M: [line(10,0,10,100), line(10,0,50,55,90,0), line(90,0,90,100)],
  N: [line(10,0,10,100), line(10,0,90,100), line(90,0,90,100)],
  O: [arc(50,50,45,50,-90,-450)],
  P: [line(15,0,15,100), arc(15,28,70,28,-90,90)],
  Q: [arc(50,50,45,50,-90,-450), line(60,70,95,105)],
  R: [line(15,0,15,100), arc(15,28,70,28,-90,90), line(15,56,90,100)],
  S: [[...arc(50,25,40,25,-35,-270), ...arc(50,75,40,25,-90,145)]],
  T: [line(5,0,95,0), line(50,0,50,100)],
  U: [[...line(10,0,10,60), ...arc(50,60,40,40,180,0), ...line(90,60,90,0)]],
  V: [line(5,0,50,100,95,0)],
  W: [line(0,0,25,100,50,40,75,100,100,0)],
  X: [line(10,0,90,100), line(90,0,10,100)],
  Y: [line(10,0,50,50), line(90,0,50,50,50,100)],
  Z: [line(10,0,90,0,10,100,90,100)],
  a: [oval(), line(80,40,80,100)],
  b: [line(20,0,20,100), arc(20,70,60,30,-90,90)],
  c: [arc(55,70,35,30,-45,-315)],
  d: [oval(), line(80,0,80,100)],
  e: [[...line(20,70,80,70), ...arc(50,70,30,30,0,-310)]],
  f: [[...arc(60,20,25,20,-30,-180), ...line(35,20,35,100)], line(10,45,75,45)],
  g: [oval(), [...line(80,40,80,110), ...arc(50,110,30,20,0,160)]],
  h: [line(20,0,20,100), [...arc(50,65,30,25,180,360), ...line(80,65,80,100)]],
  i: [line(50,40,50,100), arc(50,20,4,4,-90,270)],
  j: [[...line(65,40,65,110), ...arc(40,110,25,20,0,160)], arc(65,20,4,4,-90,270)],
  k: [line(20,0,20,100), line(80,40,20,75,85,100)],
  l: [line(50,0,50,100)],
  m: [line(10,40,10,100), [...arc(30,60,20,20,180,360), ...line(50,60,50,100)], [...arc(70,60,20,20,180,360), ...line(90,60,90,100)]],
  n: [line(20,40,20,100), [...arc(50,65,30,25,180,360), ...line(80,65,80,100)]],
  o: [oval()],
  p: [line(20,40,20,130), arc(20,70,60,30,-90,90)],
  q: [oval(), line(80,40,80,130)],
  r: [line(25,40,25,100), arc(55,65,30,25,180,300)],
  s: [[...arc(50,55,30,15,-35,-270), ...arc(50,85,30,15,-90,145)]],
  t: [[...line(45,10,45,85), ...arc(60,85,15,15,180,30)], line(15,40,80,40)],
  u: [[...line(20,40,20,75), ...arc(50,75,30,25,180,0), ...line(80,75,80,40)], line(80,40,80,100)],
  v: [line(15,40,50,100,85,40)],
  w: [line(0,40,25,100,50,55,75,100,100,40)],
  x: [line(20,40,80,100), line(80,40,20,100)],
  y: [line(15,40,50,90), line(85,40,30,130)],
  z: [line(20,40,80,40,20,100,80,100)],
  '-': [line(20,65,80,65)],
};

export const writingStrokeTemplates: Record<string, Stroke[]> = Object.fromEntries(
  Object.entries(raw).map(([letter, strokes]) => {
    const points = strokes.flat();
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    const spanY = maxY - minY;
    // Center each standalone glyph; preserve narrow stems and the proportions of bowls.
    // Descenders are part of the bounding box. The hyphen retains its punctuation height.
    const scaleY = spanY ? .70 / spanY : 0;
    const scaleX = Math.min(spanY ? .68 / spanY : .0068, maxX > minX ? .68 / (maxX - minX) : 1);
    return [letter, strokes.map(stroke => stroke.map(p => ({
      x: .5 + (p.x - (minX + maxX) / 2) * scaleX,
      y: spanY ? .14 + (p.y - minY) * scaleY : .49,
    })))];
  })
);
// Preschool A prototype: 70% of canvas height, with room for the start marker and footer.
// Rendering and validation both consume these exact normalized centerlines.
writingStrokeTemplates.A = [line(.16,.84,.50,.14), line(.50,.14,.84,.84), line(.31,.558,.69,.558)];

/** One manuscript convention: separate downward stems, left-to-right bars,
 * counterclockwise ovals, single-storey a/g, straight l, and traced circular i/j dots.
 * Each ordered path starts at points[0]; following point order specifies direction.
 */
export const writingTraceDefinitions = Object.fromEntries(Object.entries(writingStrokeTemplates).map(([letter, strokes]) => [letter, {
  letter,
  case: letter === '-' ? 'punctuation' : letter === letter.toUpperCase() ? 'uppercase' : 'lowercase',
  strokes: strokes.map((points, index) => ({ order: index + 1, start: points[0], points,
    direction: { x: points[1].x - points[0].x, y: points[1].y - points[0].y } })),
  validation: { tolerance: .055, minimumLengthRatio: .7, maximumLengthRatio: 1.8 },
}]));
