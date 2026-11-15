import type { GeneratedWorksheet } from "./worksheetTypes";
import { WORKSHEET_LAYOUT as L, worksheetIdentityBits } from "./worksheetLayout";

const escape = (value: string) => value.replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function createWorksheetHtml(worksheet: GeneratedWorksheet): string {
  const bits = worksheetIdentityBits(worksheet);
  const markers = L.markers.map(p => `<div class="marker" style="left:${p.x - L.markerSize / 2}mm;top:${p.y - L.markerSize / 2}mm"></div>`).join("");
  const code = bits.map((bit, i) => `<div style="position:absolute;left:${L.code.x + i % L.code.columns * L.code.cell}mm;top:${L.code.y + Math.floor(i / L.code.columns) * L.code.cell}mm;width:${L.code.cell}mm;height:${L.code.cell}mm;background:${bit ? "#000" : "#fff"}"></div>`).join("");
  const questions = worksheet.questions.map((q, i) => `<section class="question" style="top:${L.questionTops[i]}mm">
    <div class="question-number">QUESTION ${i + 1}</div><div class="illustration">${escape(q.illustration ?? "")}</div>
    <div class="prompt">${escape(q.prompt)}</div>
    ${q.choices.map((choice, j) => `<div class="bubble" data-question="${escape(q.id)}" data-answer="${choice.id}"
      style="left:${L.bubbleXs[j] - L.questionLeft - L.bubbleRadius}mm;top:${L.bubbleOffsetY - L.bubbleRadius}mm"></div>
      <div class="choice-text" style="left:${L.bubbleXs[j] - L.questionLeft + 5}mm"><b>${choice.id}.</b> ${escape(choice.text)}</div>`).join("")}
    </section>`).join("");
  const tracing = worksheet.tracing?.activities.map((a, i) => `<section class="question" style="top:${L.questionTops[i]}mm">
    <div class="question-number">${i + 1}. ${escape(a.prompt)}: ${escape(a.target)}</div>
    <div class="trace-sample">${a.trace ? escape(a.target) : "&nbsp;"}</div><div class="writing-lines"></div>
    </section>`).join("") ?? "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 portrait;margin:0}*{box-sizing:border-box}
    html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#20334e}
    .page{position:relative;width:${L.width}mm;height:${L.height}mm;background:white;break-after:avoid}
    .marker{position:absolute;width:${L.markerSize}mm;height:${L.markerSize}mm;background:#000}
    .header{position:absolute;top:14mm;left:16mm;right:16mm;text-align:center}
    .brand{color:#246bce;font-size:12pt;font-weight:bold;letter-spacing:2px}
    h1{margin:3mm 0 2mm;font-size:21pt;color:#173b75}.subtitle{font-size:10pt;color:#53657d}
    .student{position:absolute;top:44mm;left:16mm;width:142mm;font-size:10pt}
    .student-line{display:inline-block;width:90mm;height:6mm;border-bottom:1px solid #52657d}
    .instruction{position:absolute;top:62mm;left:16mm;right:16mm;padding:3mm;border:1px solid #bdd5f5;border-radius:3mm;background:#f0f7ff;text-align:center;font-size:10pt}
    .question{position:absolute;left:${L.questionLeft}mm;width:${L.questionWidth}mm;height:${L.questionHeight}mm;outline:0.25mm solid #d5e2f2;border-radius:4mm}
    .question-number{position:absolute;top:2mm;left:4mm;font-size:9pt;font-weight:bold}
    .illustration{position:absolute;top:2mm;right:4mm;font-size:15pt;white-space:nowrap}
    .prompt{position:absolute;top:10mm;left:4mm;right:4mm;font-size:11pt;line-height:1.2;font-weight:bold}
    .bubble{position:absolute;width:${2 * L.bubbleRadius}mm;height:${2 * L.bubbleRadius}mm;border:0.35mm solid #111;border-radius:50%}
    .choice-text{position:absolute;top:${L.bubbleOffsetY - 3}mm;width:43mm;font-size:10pt;line-height:1.1;overflow-wrap:anywhere}
    .trace-sample{position:absolute;top:6mm;left:4mm;right:4mm;color:#c3ccd8;font-size:32pt;line-height:1.2;text-align:center;letter-spacing:3mm}
    .writing-lines{position:absolute;top:20mm;left:4mm;right:4mm;height:12mm;border-top:1px dashed #8ba4c4;border-bottom:1px solid #8ba4c4}
    .footer{position:absolute;top:264mm;left:16mm;right:16mm;font-size:8pt;text-align:center;color:#53657d;overflow-wrap:anywhere}
    @media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><main class="page">${markers}${code}
    <header class="header"><div class="brand">LUMIKIDS</div><h1>${escape(worksheet.title)}</h1><div class="subtitle">Learn • Play • Grow</div></header>
    <div class="student">Name: <span class="student-line"></span><br>Ages ${worksheet.ageRange.min}–${worksheet.ageRange.max}</div>
    <div class="instruction">${worksheet.tracing ? "Trace, then write on your own. Your teacher will review all five activities." : "Fill ONE bubble for each question using a dark pencil or pen."}</div>
    ${worksheet.tracing ? tracing : questions}
    <footer class="footer">Worksheet ID: ${escape(worksheet.id)} · v${L.version}<br>Copy: ${escape(worksheet.instanceId!)}<br>Print A4 at 100%. Keep all four black corner squares visible in your photo.</footer>
    </main></body></html>`;
}
