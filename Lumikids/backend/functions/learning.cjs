const { readingQuizzes } = require("./curriculum/data/readingQuizzes");
const { readingLessons } = require("./curriculum/data/readingLessons");
const { mathLessons } = require("./curriculum/data/mathLessons");
const { mathQuizzes } = require("./curriculum/data/mathQuizzes");
const { writingLessons } = require("./curriculum/data/writingLessons");
const { writingStrokeTemplates } = require("./curriculum/data/writingStrokeTemplates");
const { mascotShop } = require("./curriculum/data/mascotShop");
const { createWorksheet } = require("./curriculum/data/phygitalWorksheets");
const { canonicalJson, WORKSHEET_LAYOUT, worksheetTimestamp } = require("./curriculum/services/phygital/worksheetLayout");
const { isTraceCanvasSize, validateTraceStroke } = require("./curriculum/services/writing/tracingValidator");
const { bestAttempt } = require("./curriculum/utils/assessmentAttempt");
const { evaluateQuiz } = require("./curriculum/utils/ruleEngine");
const { getLevel } = require("./curriculum/utils/xp");

class InvalidOperation extends Error {
  constructor(message, reason = "invalid-operation") {
    super(message);
    this.reason = reason;
  }
}
function requireValid(value, message = "Invalid learning operation.") {
  if (!value) throw new InvalidOperation(message);
}
function exact(value, keys) {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

const units = { reading: readingLessons, writing: writingLessons, math: mathLessons };
const wallet = new Map(mascotShop.map(item => [item.id, item.price]));
const safe = value => Number.isSafeInteger(value) ? value : 0;
const flag = value => value === true || value === 1;
const choices = readingLessons.map(lesson => [lesson.letter, lesson.word, lesson.emoji, lesson.letter]);

function profileSummary(root) {
  const progress = Object.fromEntries(Object.keys(units).map(subject => {
    const key = subject + "Progress";
    const entries = Object.entries(root[key] ?? {}).filter(([id]) => units[subject].some(unit => String(unit.id) === String(subject === "math" ? Number(id) : id)));
    const normalized = new Map();
    for (const [rawId, entry] of entries) {
      if (!entry || typeof entry !== "object") continue;
      const id = subject === "math" ? String(Number(rawId)) : rawId;
      const prior = normalized.get(id);
      const attempt = bestAttempt(prior, entry);
      normalized.set(id, {
        unlocked: flag(entry.unlocked) || flag(prior?.unlocked), completed: flag(entry.completed) || flag(prior?.completed),
        stars: Math.max(safe(entry.stars), safe(prior?.stars)),
        ...(subject === "writing" ? {} : { quizScore: safe(attempt?.quizScore), quizTotal: safe(attempt?.quizTotal) }),
        ...(subject === "math" ? { xpEarned: Math.max(safe(entry.xpEarned), safe(prior?.xpEarned)) } : {}),
      });
    }
    const first = String(units[subject][0].id);
    normalized.set(first, { ...normalized.get(first), unlocked: true });
    return [key, Object.fromEntries(normalized)];
  }));
  const ownedMascots = [...new Set(["default", ...(Array.isArray(root.ownedMascots) ? root.ownedMascots.filter(id => wallet.has(id)) : [])])];
  return {
    id: root.id, name: root.name, classCode: root.classCode, ...progress,
    xp: safe(root.xp), coins: safe(root.coins), level: getLevel(safe(root.xp)), streak: safe(root.streak),
    readingXP: safe(root.readingXP), writingXP: safe(root.writingXP), mathXP: safe(root.mathXP),
    ownedMascots, avatar: ownedMascots.includes(root.avatar) ? root.avatar : "default",
    mistakes: root.mistakes ?? {}, profileRevision: safe(root.profileRevision),
  };
}

function lessonFor(profile, subject, lessonId) {
  requireValid(Object.hasOwn(units, subject) && typeof lessonId === "string");
  const index = units[subject].findIndex(unit => String(unit.id) === lessonId);
  requireValid(index >= 0);
  const progress = profile[subject + "Progress"];
  const previous = progress[lessonId] ?? {};
  const unlocked = index === 0 || flag(previous.unlocked) || flag(previous.completed);
  return { lesson: units[subject][index], progress, previous, next: units[subject][index + 1], unlocked };
}

function requireUnlocked(unlocked) {
  if (!unlocked) throw new InvalidOperation("The lesson is locked on the server.", "dependency");
}

function applyAssessment(profile, subject, lessonId, score, total) {
  const { lesson, progress, previous, next, unlocked } = lessonFor(profile, subject, lessonId);
  requireUnlocked(unlocked);
  const result = evaluateQuiz(score, total);
  const passed = subject === "writing" ? score === total : result.passed;
  const stars = passed ? result.stars : 0;
  const completed = flag(previous.completed);
  if (subject !== "writing" || passed) {
    const pair = bestAttempt(previous, { quizScore: score, quizTotal: total });
    progress[lessonId] = {
      unlocked: true, completed: completed || passed, stars: Math.max(safe(previous.stars), stars),
      ...(subject === "writing" ? {} : { quizScore: pair.quizScore, quizTotal: pair.quizTotal }),
      ...(subject === "math" ? { xpEarned: passed ? lesson.xpReward : safe(previous.xpEarned) } : {}),
    };
  }
  if (passed && next) {
    const id = String(next.id);
    progress[id] = { ...progress[id], unlocked: true };
  }
  if (passed && !completed) {
    const xp = subject === "math" ? lesson.xpReward : lesson.xp;
    profile.xp += xp;
    profile[subject + "XP"] += xp;
    profile.coins += subject === "math" ? stars * 5 : lesson.coins;
    profile.level = getLevel(profile.xp);
  }
  return { passed, stars };
}

function verifyQuiz(profile, operation) {
  requireValid(exact(operation, ["type", "subject", "lessonId", "answers"]) &&
    (operation.subject === "reading" || operation.subject === "math"));
  const { subject, lessonId, answers } = operation;
  lessonFor(profile, subject, lessonId);
  const items = subject === "reading" ? readingQuizzes[lessonId] : mathQuizzes.filter(item => String(item.lessonId) === lessonId);
  requireValid(Array.isArray(answers) && answers.length === items.length);
  let score = 0;
  for (let i = 0; i < items.length; i++) {
    const question = items[i];
    const answer = answers[i];
    const key = subject === "reading" ? question.answer : question.correctAnswer;
    requireValid(typeof answer === "string" &&
      (subject === "reading" ? choices.some(item => item[i] === answer) : question.options.includes(answer)));
    if (answer === key) score++;
  }
  applyAssessment(profile, subject, lessonId, score, items.length);
}

function verifyMistake(profile, operation) {
  requireValid(exact(operation, ["type", "subject", "lessonId", "questionIndex", "answer"]) &&
    (operation.subject === "reading" || operation.subject === "math"));
  const { subject, lessonId, questionIndex, answer } = operation;
  const { unlocked } = lessonFor(profile, subject, lessonId);
  const items = subject === "reading" ? readingQuizzes[lessonId] : mathQuizzes.filter(item => String(item.lessonId) === lessonId);
  requireValid(Number.isInteger(questionIndex) && questionIndex >= 0 && questionIndex < items.length);
  const question = items[questionIndex];
  const correctAnswer = subject === "reading" ? question.answer : question.correctAnswer;
  requireValid(typeof answer === "string" && answer !== correctAnswer &&
    (subject === "reading" ? choices.some(item => item[questionIndex] === answer) : question.options.includes(answer)));
  requireUnlocked(unlocked);
  const key = subject + "_" + lessonId + "_" + questionIndex;
  profile.mistakes[key] = {
    subject, lessonId, questionKey: String(questionIndex), question: question.question,
    selectedAnswer: answer, correctAnswer, count: Math.min(1000, safe(profile.mistakes[key]?.count) + 1),
  };
}

function verifyTracing(profile, operation) {
  requireValid(exact(operation, ["type", "lessonId", "phases"]) && Array.isArray(operation.phases) && operation.phases.length === 3);
  const { lesson } = lessonFor(profile, "writing", operation.lessonId);
  const targets = [lesson.letter.toUpperCase(), lesson.letter.toLowerCase(), lesson.word];
  const budget = { points: 24_000, comparisons: 1_250_000 };
  let points = 0;
  targets.forEach((target, phase) => {
    const traces = operation.phases[phase];
    requireValid(Array.isArray(traces) && traces.length === Array.from(target).length);
    Array.from(target).forEach((letter, index) => {
      const trace = traces[index];
      requireValid(exact(trace, ["width", "height", "strokes"]));
      const { width, height, strokes } = trace;
      requireValid(isTraceCanvasSize(width, height) && Array.isArray(strokes) && strokes.length === writingStrokeTemplates[letter]?.length);
      strokes.forEach((stroke, i) => {
        requireValid(Array.isArray(stroke) && stroke.length >= 2 && stroke.length <= 4000);
        points += stroke.length;
        requireValid(points <= 32000 && stroke.every(point => exact(point, ["x", "y"]) &&
          Number.isFinite(point.x) && point.x >= -width && point.x <= width * 2 &&
          Number.isFinite(point.y) && point.y >= -height && point.y <= height * 2));
        requireValid(validateTraceStroke(letter, stroke, i, width, height, budget));
      });
    });
  });
  applyAssessment(profile, "writing", operation.lessonId, 3, 3);
}

function applyOperation(profile, operation) {
  if (operation?.type === "quiz") return verifyQuiz(profile, operation);
  if (operation?.type === "mistake") return verifyMistake(profile, operation);
  if (operation?.type === "trace") return verifyTracing(profile, operation);
  requireValid(exact(operation, ["type", "mascotId"]) && wallet.has(operation.mascotId));
  const { type, mascotId } = operation;
  if (type === "purchase") {
    if (profile.ownedMascots.includes(mascotId)) return;
    const price = wallet.get(mascotId);
    if (profile.coins < price) throw new InvalidOperation("The current server balance cannot cover this purchase.", "dependency");
    profile.coins -= price;
    profile.ownedMascots.push(mascotId);
  } else {
    requireValid(type === "equip");
    if (!profile.ownedMascots.includes(mascotId)) throw new InvalidOperation("The mascot must be purchased first.", "dependency");
    profile.avatar = mascotId;
  }
}

const validDate = (value, now) => worksheetTimestamp(value, now) !== undefined;
function isOlderWorksheetCapture(existing, incoming, now) {
  if (!existing) return false;
  if (!incoming) return true;
  const before = worksheetTimestamp(existing.capturedAt, now) ?? 0;
  const after = worksheetTimestamp(incoming.capturedAt, now) ?? 0;
  return before > after || (before !== 0 && before === after && canonicalJson(existing) > canonicalJson(incoming));
}
const answersValid = (list, count) => Array.isArray(list) && list.length === count && list.every(value => [null, "A", "B", "C"].includes(value));
const range = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

function verifyWorksheet(input, studentId, now = Date.now()) {
  requireValid(input && input.studentId === studentId && typeof input.instanceId === "string" &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.instanceId) &&
    Object.hasOwn(units, input.subject) && typeof input.lessonId === "string" &&
    units[input.subject].some(unit => String(unit.id) === input.lessonId) && validDate(input.createdAt, now));
  const expected = {
    ...createWorksheet(input.subject, input.lessonId), createdAt: input.createdAt,
    studentId, instanceId: input.instanceId, templateVersion: WORKSHEET_LAYOUT.version,
  };
  requireValid(canonicalJson(input) === canonicalJson(expected), "Worksheet content does not match the curriculum.");
  return JSON.parse(JSON.stringify(expected));
}

function verifyCapture(capture, worksheet, now = Date.now()) {
  const count = worksheet.questions.length;
  const keys = ["worksheetInstanceId", "answers", "confidence", "statuses", "darkness", "imageWidth", "imageHeight", "validated", "quality"];
  if (capture?.capturedAt !== undefined) keys.push("capturedAt");
  requireValid(exact(capture, keys) && capture.validated === true && capture.worksheetInstanceId === worksheet.instanceId &&
    (capture.capturedAt === undefined || validDate(capture.capturedAt, now)) && answersValid(capture.answers, count) &&
    Array.isArray(capture.statuses) && capture.statuses.length === count &&
    capture.statuses.every(value => ["recognized", "blank", "ambiguous", "multiple-marks", "unreadable"].includes(value)) &&
    Array.isArray(capture.confidence) && capture.confidence.length === count && capture.confidence.every(value => range(value, 0, 1)) &&
    Array.isArray(capture.darkness) && capture.darkness.length === count &&
    capture.darkness.every(row => Array.isArray(row) && row.length === 3 && row.every(value => range(value, 0, 1))) &&
    Number.isInteger(capture.imageWidth) && range(capture.imageWidth, 1, 10000) &&
    Number.isInteger(capture.imageHeight) && range(capture.imageHeight, 1, 10000) &&
    exact(capture.quality, ["paperBrightness", "edgeSharpness"]) && Object.values(capture.quality).every(value => range(value, 0, 255)));
  return capture;
}

function applyWorksheet(profile, worksheet, review, teacherId, now = Date.now()) {
  requireValid(exact(review, ["answers", "writing", "finalizedAt"]) && answersValid(review.answers, worksheet.questions.length) &&
    Array.isArray(review.writing) && validDate(review.finalizedAt, now));
  requireValid(worksheet.subject === "writing"
    ? review.writing.length === 5 && review.writing.every(value => typeof value === "boolean")
    : review.writing.length === 0);
  const score = worksheet.subject === "writing"
    ? review.writing.filter(Boolean).length
    : worksheet.questions.filter((question, i) => question.correctAnswer === review.answers[i]).length;
  const { passed, stars } = applyAssessment(profile, worksheet.subject, worksheet.lessonId, score, 5);
  return {
    studentId: worksheet.studentId, instanceId: worksheet.instanceId, subject: worksheet.subject, lessonId: worksheet.lessonId,
    answers: review.answers, writing: review.writing, score, total: 5, passed, stars, teacherId, finalizedAt: review.finalizedAt,
  };
}

module.exports = { InvalidOperation, requireValid, exact, profileSummary, applyOperation, verifyWorksheet, verifyCapture, isOlderWorksheetCapture, applyWorksheet };
