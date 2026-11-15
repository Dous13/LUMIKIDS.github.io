const jpeg = require('jpeg-js');
const { loader } = require('./runtime.cjs');
const load = loader();
const { WORKSHEET_LAYOUT: L, worksheetIdentityBits } = load('src/services/phygital/worksheetLayout.ts');
const { projectiveMap } = load('src/services/phygital/worksheetAnalyzer.ts');

// Deterministic camera-like raster: page on a grey desk, printed outlines/text,
// uneven illumination, irregular pencil fills, perspective and JPEG compression.
function worksheetPhoto(worksheet, answers = [], options = {}) {
  const width = 850, height = 1150;
  const corners = options.corners ?? [{ x: 60, y: 45 }, { x: 790, y: 45 }, { x: 790, y: 1080 }, { x: 60, y: 1080 }];
  const physical = [{ x: 0, y: 0 }, { x: L.width, y: 0 }, { x: L.width, y: L.height }, { x: 0, y: L.height }];
  const inverse = projectiveMap(corners, physical), bits = worksheetIdentityBits(worksheet);
  const data = Buffer.alloc(width * height * 4);
  const bubbles = worksheet.bubbleLayout?.positions ?? [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = inverse({ x, y });
    let value = 175;
    if (p.x >= 0 && p.y >= 0 && p.x <= L.width && p.y <= L.height) {
      value = 247 - 15 * (p.y / L.height) - 8 * Math.sin(p.x / 40);
      let ink = L.markers.some((m, i) => i !== options.missingMarker && Math.abs(p.x - m.x) <= 3 && Math.abs(p.y - m.y) <= 3);
      const col = Math.floor((p.x - L.code.x) / L.code.cell), row = Math.floor((p.y - L.code.y) / L.code.cell);
      if (col >= 0 && col < L.code.columns && row >= 0 && row < L.code.rows) ink ||= bits[row * L.code.columns + col] === 1;
      for (const top of L.questionTops) {
        if (p.x > 20 && p.x < 125 && p.y > top + 10 && p.y < top + 12 && Math.floor(p.x) % 3 !== 0) ink = true;
      }
      for (const b of bubbles) {
        const dx = p.x - b.x * L.width, dy = p.y - b.y * L.height, r = Math.hypot(dx, dy);
        if (r > 3.15 && r < 3.5) ink = true;
        const index = worksheet.questions.findIndex(q => q.id === b.questionId);
        const marked = Array.isArray(answers[index]) ? answers[index].includes(b.answer) : answers[index] === b.answer;
        if (marked && (options.cross ? (Math.abs(dx - dy) < .5 || Math.abs(dx + dy) < .5) && r < 2.7 : r < 2.5 + .15 * Math.sin(dx * 7))) ink = true;
        if (options.faint === index && b.answer === 'A' && r < .7) ink = true;
      }
      if (ink) value = 24 + ((x * 17 + y * 13) % 18);
    }
    if (options.dark) value *= .3;
    if (options.overexposed) value = 255;
    const i = (y * width + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = Math.round(value); data[i + 3] = 255;
  }
  if (options.blur) {
    const radius = options.blur, tmp = Buffer.from(data);
    for (let y = radius; y < height - radius; y++) for (let x = radius; x < width - radius; x++) {
      let sum = 0;
      for (let d = -radius; d <= radius; d++) sum += data[(y * width + x + d) * 4];
      const i = (y * width + x) * 4; tmp[i] = tmp[i + 1] = tmp[i + 2] = sum / (radius * 2 + 1);
    }
    for (let y = radius; y < height - radius; y++) for (let x = radius; x < width - radius; x++) {
      let sum = 0;
      for (let d = -radius; d <= radius; d++) sum += tmp[((y + d) * width + x) * 4];
      const i = (y * width + x) * 4; data[i] = data[i + 1] = data[i + 2] = sum / (radius * 2 + 1);
    }
  }
  return jpeg.encode({ data, width, height }, 88).data.toString('base64');
}
module.exports = { worksheetPhoto };
