import type { GeneratedWorksheet, WorksheetQuestion } from "./worksheetTypes";

// Millimetres on A4. Print, camera normalization and regression fixtures share this contract.
export const WORKSHEET_LAYOUT = {
  version: 2, width: 210, height: 297, questionTops: [76, 113, 150, 187, 224],
  questionLeft: 16, questionWidth: 178, questionHeight: 35,
  bubbleOffsetY: 27, bubbleRadius: 3.5,
  bubbleXs: [25, 25 + 178 / 3, 25 + 356 / 3],
  markers: [{ x: 10, y: 10 }, { x: 200, y: 10 }, { x: 200, y: 287 }, { x: 10, y: 287 }],
  markerSize: 6,
  code: { x: 166, y: 36, columns: 16, rows: 12, cell: 2 },
} as const;

export function createBubbleLayout(questions: WorksheetQuestion[]) {
  return {
    pageWidthMm: WORKSHEET_LAYOUT.width, pageHeightMm: WORKSHEET_LAYOUT.height,
    positions: questions.flatMap((q, i) => q.choices.map((choice, j) => ({
      questionId: q.id, answer: choice.id,
      x: WORKSHEET_LAYOUT.bubbleXs[j] / WORKSHEET_LAYOUT.width,
      y: (WORKSHEET_LAYOUT.questionTops[i] + WORKSHEET_LAYOUT.bubbleOffsetY) / WORKSHEET_LAYOUT.height,
    }))),
  };
}

// Firestore may reorder map keys. Preserve content identity across serialization.
export const canonicalJson = (value: any): string => Array.isArray(value) ? `[${value.map(canonicalJson).join(",")}]` :
    value && typeof value === "object" ? `{${Object.keys(value).filter(key => value[key] !== undefined).sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}` : JSON.stringify(value);

// A local template checksum, not an authentication signature.
export function worksheetFingerprint(worksheet: GeneratedWorksheet): string {
  const content = canonicalJson({ id: worksheet.id, studentId: worksheet.studentId,
    instanceId: worksheet.instanceId, subject: worksheet.subject, lessonId: worksheet.lessonId,
    ageRange: worksheet.ageRange, questions: worksheet.questions, tracing: worksheet.tracing,
    version: worksheet.templateVersion, bubbleLayout: worksheet.bubbleLayout });
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function worksheetIdentityBits(worksheet: GeneratedWorksheet): number[] {
  const uuid = worksheet.instanceId?.replace(/-/g, "");
  if (!uuid || !/^[a-f0-9]{32}$/i.test(uuid) || !worksheet.studentId || worksheet.templateVersion !== 2) {
    throw new Error("Print a newly issued worksheet before scanning.");
  }
  const payload = `a502${uuid}${worksheetFingerprint(worksheet)}`;
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 2) {
    crc ^= parseInt(payload.slice(i, i + 2), 16) << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return [...(payload + crc.toString(16).padStart(4, "0"))]
    .flatMap(hex => [...parseInt(hex, 16).toString(2).padStart(4, "0")].map(Number));
}
