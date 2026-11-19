const { fakeFirebase } = require('./cloud-fixture.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loader, sqlite, root, hooks, nodes, native } = require('./runtime.cjs');
const { worksheetPhoto } = require('./worksheet-fixtures.cjs');
const basic = loader();
const generation = basic('src/data/phygitalWorksheets.ts');
const { analyzeWorksheet } = basic('src/services/phygital/worksheetAnalyzer.ts');
const { WORKSHEET_LAYOUT: L } = basic('src/services/phygital/worksheetLayout.ts');
const { createWorksheetHtml } = basic('src/services/phygital/worksheetPrint.ts');
const crypto = require('node:crypto');
function issued(subject = 'math', level = 1, owner = 'alice') {
  return { ...generation.createWorksheet(subject, level), studentId: owner, instanceId: crypto.randomUUID(), templateVersion: 2 };
}

test('all Reading/Math levels have five distinct questions, keys and coordinated A4 regions; Writing retains tracing with five targets', () => {
  for (const [subject, lessons] of [
    ['reading', basic('src/data/readingLessons.ts').readingLessons],
    ['math', basic('src/data/mathLessons.ts').mathLessons],
    ['writing', basic('src/data/writingLessons.ts').writingLessons],
  ]) for (const lesson of lessons) {
    const w = issued(subject, lesson.id), html = createWorksheetHtml(w);
    assert.equal(w.subject, subject); assert.equal(w.lessonId, String(lesson.id));
    assert.deepEqual(w.ageRange, { min: 3, max: 5 });
    assert.equal((html.match(/<section class="question"/g) ?? []).length, 5);
    assert.equal((html.match(/class="marker"/g) ?? []).length, 4);
    assert.ok(html.includes('size:A4 portrait'));
    if (w.tracing) {
      assert.equal(w.tracing.activities.length, 5);
      assert.equal(w.tracing.activities[2].target, lesson.traceWord);
      assert.ok(w.tracing.activities.every(a => a.target.length));
    } else {
      assert.equal(w.questions.length, 5);
      assert.equal(new Set(w.questions.map(q => q.id)).size, 5);
      assert.equal(w.bubbleLayout.positions.length, 15);
      assert.ok(w.questions.every(q => q.difficulty === 1 && q.choices.some(c => c.id === q.correctAnswer)));
      for (const [i, q] of w.questions.entries()) for (const p of w.bubbleLayout.positions.filter(p => p.questionId === q.id)) {
        assert.ok(Math.abs(p.y * L.height - L.questionTops[i] - L.bubbleOffsetY) < 1e-8);
        assert.ok(p.x * L.width - L.bubbleRadius > L.questionLeft);
        assert.ok(p.y * L.height + L.bubbleRadius < L.questionTops[i] + L.questionHeight);
      }
    }
    assert.ok(L.questionTops[4] + L.questionHeight < 264);
  }
  assert.equal(generation.createMathWorksheet(1).questions.length, 5);
  assert.throws(() => generation.createMathWorksheet(1, [1, 1, 2, 3, 4]), /distinct/);
  assert.throws(() => generation.createMathWorksheet(1, [1, 2, 3]), /enough/);
});

test('JPEG scan detects all five filled bubbles and cross marks after rotation, distance and perspective changes', () => {
  const w = issued(), expected = ['A', 'B', 'C', 'A', 'B'];
  for (const options of [{}, { cross: true }, { corners: [{ x: 115, y: 36 }, { x: 797, y: 115 }, { x: 718, y: 1104 }, { x: 35, y: 1026 }] },
    { corners: [{ x: 100, y: 90 }, { x: 730, y: 42 }, { x: 790, y: 1020 }, { x: 50, y: 1090 }] }]) {
    const result = analyzeWorksheet(worksheetPhoto(w, expected, options), w);
    assert.deepEqual(result.answers, expected);
    assert.deepEqual(result.statuses, Array(5).fill('recognized'));
    assert.equal(result.validated, true);
  }
});

test('blank, partial, faint and multiple answers remain explicit and require teacher review', () => {
  const w = issued();
  const result = analyzeWorksheet(worksheetPhoto(w, ['B', null, ['A', 'C'], null, 'C'], { faint: 3 }), w);
  assert.deepEqual(result.answers, ['B', null, null, null, 'C']);
  assert.deepEqual(result.statuses, ['recognized', 'blank', 'multiple-marks', 'ambiguous', 'recognized']);
});

test('scanner rejects cropped pages, missing markers, blur, dark, overexposed and wrong identity/owner/template', () => {
  const w = issued();
  for (const options of [{ missingMarker: 2 }, { blur: 6 }, { dark: true }, { overexposed: true },
    { corners: [{ x: -20, y: 20 }, { x: 800, y: 20 }, { x: 800, y: 1100 }, { x: -20, y: 1100 }] }]) {
    assert.throws(() => analyzeWorksheet(worksheetPhoto(w, [], options), w), /retake|whole page|border|complete page/i);
  }
  const photo = worksheetPhoto(w);
  assert.throws(() => analyzeWorksheet(photo, { ...w, instanceId: crypto.randomUUID() }), /not the selected/);
  assert.throws(() => analyzeWorksheet(photo, { ...w, studentId: 'bob' }), /not the selected/);
  assert.throws(() => analyzeWorksheet(photo, { ...w, lessonId: '2' }), /not the selected/);
  assert.throws(() => analyzeWorksheet(photo, { ...w, templateVersion: 1 }), /newly issued/);
});

function fixture(filename, cloud = new Map()) {
  const storage = sqlite(filename); let failUpload = false, failRootOnce = false;
  const firebase = fakeFirebase(cloud, {
    network() { if (failUpload) throw new Error('offline'); },
    async commit(writes) {
      if (failRootOnce && writes.some(([ref]) => ref === 'students/alice')) {
        failRootOnce = false; throw new Error('interrupted worksheet transaction');
      }
      for (const [ref, payload] of writes) cloud.set(ref, { ...cloud.get(ref), ...payload });
    },
  });
  const load = loader({ 'expo-sqlite': { openDatabaseSync: () => storage.db },
    [path.join(root, 'src/services/firebase/firebase.ts')]: { db: {} },
    'firebase/auth': firebase.authMock, 'firebase/functions': firebase.functionsMock,
    'firebase/firestore': {
      doc: (_, ...parts) => parts.join('/'), collection: (_, ...parts) => parts.join('/'),
      getDocFromServer: firebase.getStudent,
      getDocsFromServer: async ref => ({ docs: [...cloud].filter(([key]) => key.startsWith(ref + '/')).map(([key, value]) => ({ id: key.split('/').at(-1), data: () => value })) }),
    },
  });
  load('src/services/database/database.ts').initializeDatabase();
  const store = load('src/services/phygital/worksheetStore.ts');
  for (const id of ['alice', 'bob']) {
    if (!cloud.has('students/' + id)) cloud.set('students/' + id, { id, name: id, classCode: 'class' });
    storage.db.runSync('INSERT OR IGNORE INTO student (id, name, classCode) VALUES (?, ?, ?)', [id, id, 'class']);
    load('src/services/database/localMath.ts').initializeMathProgress(id);
    store.cacheWorksheetReviewAccess('teacher', id, 'class');
  }
  return { ...storage, load, store, cloud, offline(value) { failUpload = value; }, interruptProgressUpload() { failRootOnce = true; } };
}

test('end-to-end: issue → HTML → synthetic JPEG → correction draft → restart → finalize → retry/reconnect; no duplicate rewards or cross-account history', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumikids-worksheet-')), filename = path.join(dir, 'test.db'), cloud = new Map();
  let f = fixture(filename, cloud);
  try {
    const w = f.store.issueWorksheet('alice', 'math', 1, crypto.randomUUID());
    assert.ok(createWorksheetHtml(w).includes(w.instanceId));
    const wrong = w.questions.map(q => q.correctAnswer === 'A' ? 'B' : 'A');
    const analysis = analyzeWorksheet(worksheetPhoto(w, wrong), w);
    f.store.saveWorksheetCapture('alice', w.instanceId, analysis, 'file:///photo.jpg');
    assert.equal(f.load('src/services/database/localMath.ts').isMathLessonCompleted('alice', 1), false);
    const review = { teacherId: 'teacher', answers: w.questions.map(q => q.correctAnswer), writing: [], reviewed: [true, true, true, true, false] };
    f.store.saveWorksheetReview('alice', w.instanceId, review);
    assert.throws(() => f.store.finalizeWorksheet('alice', w.instanceId, 'teacher'), /all five/);
    assert.throws(() => f.store.finalizeWorksheet('alice', w.instanceId, 'stranger'), /roster/);
    assert.throws(() => f.store.getWorksheetRecord('bob', w.instanceId), /not saved/);
    f.raw.close(); f = fixture(filename, cloud);
    const saved = f.store.getWorksheetRecord('alice', w.instanceId);
    assert.deepEqual(saved.capture.answers, wrong); assert.deepEqual(saved.review.answers, review.answers);
    review.reviewed[4] = true;
    f.store.saveWorksheetReview('alice', w.instanceId, review);
    const result = f.store.finalizeWorksheet('alice', w.instanceId, 'teacher');
    assert.equal(result.score, 5); assert.equal(result.total, 5); assert.equal(result.passed, true);
    assert.deepEqual(f.store.finalizeWorksheet('alice', w.instanceId, 'teacher'), result);
    const math = f.load('src/services/database/localMath.ts');
    assert.equal(math.isMathLessonUnlocked('alice', 2), true); assert.equal(math.isMathLessonUnlocked('bob', 2), false);
    assert.equal(f.store.getWorksheetHistory('bob').length, 0);
    assert.deepEqual({ ...f.db.getFirstSync('SELECT mathXP, coins FROM student WHERE id = ?', ['alice']) }, { mathXP: 50, coins: 15 });
    f.offline(true); await f.load('src/services/sync/processQueue.ts').processQueue(undefined, () => true);
    assert.ok(f.db.getFirstSync('SELECT COUNT(*) AS n FROM sync_queue WHERE synced = 0').n > 0);
    f.offline(false);
    cloud.set('students/alice', { ...cloud.get('students/alice'), mathProgress: { '1': { completed: false }, '2': { unlocked: false } } });
    await f.load('src/services/sync/processQueue.ts').processQueue(undefined, () => true);
    assert.equal(f.db.getFirstSync('SELECT COUNT(*) AS n FROM sync_queue WHERE synced = 0').n, 0);
    const remote = cloud.get('students/alice/worksheetResults/' + w.instanceId);
    assert.deepEqual(remote.finalized, result); assert.equal(remote.worksheet.studentId, 'alice');
    assert.equal([...cloud.keys()].filter(key => key.includes('worksheetResults')).length, 1);
    assert.equal(math.isMathLessonUnlocked('alice', 2), true);
    await f.load('src/services/sync/syncWorksheet.ts').restoreWorksheetHistory('alice');
    assert.deepEqual(f.store.getWorksheetRecord('alice', w.instanceId).finalized, result);
  } finally { f.raw.close(); fs.rmSync(dir, { recursive: true }); }
});

test('Reading scores five corrections through existing rules; Writing waits for all five manual completions', () => {
  const f = fixture();
  try {
    for (const subject of ['reading', 'writing']) {
      const w = f.store.issueWorksheet('alice', subject, 'A', crypto.randomUUID());
      const analysis = analyzeWorksheet(worksheetPhoto(w), w);
      f.store.saveWorksheetCapture('alice', w.instanceId, analysis, 'file:///photo.jpg');
      const review = { teacherId: 'teacher', answers: w.questions.map(q => q.correctAnswer),
        writing: subject === 'writing' ? [true, true, true, true, false] : [], reviewed: Array(5).fill(true) };
      if (subject === 'reading') review.answers[4] = null;
      f.store.saveWorksheetReview('alice', w.instanceId, review);
      const result = f.store.finalizeWorksheet('alice', w.instanceId, 'teacher');
      assert.equal(result.score, 4); assert.equal(result.passed, subject === 'reading');
      if (subject === 'writing') {
        assert.equal(f.load('src/services/database/localWriting.ts').isWritingLessonCompleted('alice', 'A'), false);
        const next = f.store.issueWorksheet('alice', subject, 'A', crypto.randomUUID());
        f.store.saveWorksheetCapture('alice', next.instanceId, analyzeWorksheet(worksheetPhoto(next), next), 'file:///photo.jpg');
        f.store.saveWorksheetReview('alice', next.instanceId, { ...review, writing: Array(5).fill(true) });
        assert.equal(f.store.finalizeWorksheet('alice', next.instanceId, 'teacher').passed, true);
      }
    }
  } finally { f.raw.close(); }
});

test('failed result storage rolls back progress, rewards and finalization; a second worksheet attempt never pays twice', () => {
  const f = fixture();
  try {
    const w = f.store.issueWorksheet('alice', 'math', 1, crypto.randomUUID());
    f.store.saveWorksheetCapture('alice', w.instanceId, analyzeWorksheet(worksheetPhoto(w), w), 'file:///photo.jpg');
    const review = { teacherId: 'teacher', answers: w.questions.map(q => q.correctAnswer), writing: [], reviewed: Array(5).fill(true) };
    f.store.saveWorksheetReview('alice', w.instanceId, review);
    f.db.execSync("CREATE TRIGGER fail_result BEFORE UPDATE OF finalized ON worksheet_instances BEGIN SELECT RAISE(ABORT, 'result save failed'); END;");
    assert.throws(() => f.store.finalizeWorksheet('alice', w.instanceId, 'teacher'), /result save failed/);
    assert.equal(f.load('src/services/database/localMath.ts').isMathLessonCompleted('alice', 1), false);
    assert.equal(f.store.getWorksheetRecord('alice', w.instanceId).finalized, null);
    assert.equal(f.db.getFirstSync('SELECT xp FROM student WHERE id = ?', ['alice']).xp, 0);
    f.db.execSync('DROP TRIGGER fail_result');
    f.store.finalizeWorksheet('alice', w.instanceId, 'teacher');
    const second = f.store.issueWorksheet('alice', 'math', 1, crypto.randomUUID());
    f.store.saveWorksheetCapture('alice', second.instanceId, analyzeWorksheet(worksheetPhoto(second), second), 'file:///photo2.jpg');
    f.store.saveWorksheetReview('alice', second.instanceId, review);
    f.store.finalizeWorksheet('alice', second.instanceId, 'teacher');
    assert.equal(f.store.getWorksheetHistory('alice').filter(r => r.finalized).length, 2);
    assert.deepEqual({ ...f.db.getFirstSync('SELECT xp, coins FROM student WHERE id = ?', ['alice']) }, { xp: 50, coins: 15 });
  } finally { f.raw.close(); }
});

test('cloud map ordering cannot change the printed identity; older cloud records cannot overwrite finalized local corrections', async () => {
  const f = fixture();
  try {
    const w = f.store.issueWorksheet('alice', 'math', 1, crypto.randomUUID());
    const reorder = value => Array.isArray(value) ? value.map(reorder) : value && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reorder(v)])) : value;
    const identity = basic('src/services/phygital/worksheetLayout.ts').worksheetIdentityBits;
    assert.deepEqual(identity(w), identity(reorder(w)));
    f.store.saveWorksheetCapture('alice', w.instanceId, analyzeWorksheet(worksheetPhoto(w), w), 'file:///photo.jpg');
    f.store.saveWorksheetReview('alice', w.instanceId, { teacherId: 'teacher', answers: w.questions.map(q => q.correctAnswer), writing: [], reviewed: Array(5).fill(true) });
    const result = f.store.finalizeWorksheet('alice', w.instanceId, 'teacher');
    f.cloud.set('students/alice/worksheetResults/' + w.instanceId, { worksheet: w, finalized: { ...result, score: 0 } });
    await f.load('src/services/sync/syncWorksheet.ts').restoreWorksheetHistory('alice');
    assert.deepEqual(f.store.getWorksheetRecord('alice', w.instanceId).finalized, result);
    assert.equal(await f.load('src/services/sync/syncWorksheet.ts').syncWorksheet('alice', w.instanceId, () => true), 'blocked');
    assert.equal(f.store.getWorksheetRecord('alice', w.instanceId).syncConflict.finalized.score, 0);
    assert.deepEqual(f.store.getWorksheetRecord('alice', w.instanceId).finalized, result);
    assert.equal(f.cloud.get('students/alice/worksheetResults/' + w.instanceId).finalized.score, 0);
  } finally { f.raw.close(); }
});

test('real capture and review handlers connect camera output to persisted corrections and final progression', async () => {
  const f = fixture();
  try {
    const w = f.store.issueWorksheet('alice', 'math', 1, crypto.randomUUID());
    const base64 = worksheetPhoto(w, [null, 'B', null, 'C', 'A']);
    const h = hooks(), navigation = { goBack() {}, navigate() {} }, copies = [];
    class File {
      constructor(...parts) { this.uri = parts.join('/'); }
      copy(target) { copies.push(target.uri); }
    }
    const loadCapture = loader({ react: h.React,
      'react-native': { ...native, AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) }, Image: 'Image', Pressable: 'Pressable' },
      'expo-camera': { CameraView: 'CameraView', useCameraPermissions: () => [{ granted: true }, () => {}] },
      'expo-file-system': { File, Paths: { document: 'file:///documents' } },
      '@expo/vector-icons': { Ionicons: 'Ionicons' },
      '@react-navigation/native': { useNavigation: () => navigation, useIsFocused: () => true,
        useRoute: () => ({ params: { subject: 'math', lessonId: 1, instanceId: w.instanceId } }) },
      [path.join(root, 'src/services/session/session.ts')]: { getSession: async () => ({ studentId: 'alice' }) },
      [path.join(root, 'src/services/phygital/worksheetStore.ts')]: f.store,
    });
    const Capture = loadCapture('src/screens/phygital/WorksheetCaptureScreen.tsx').default;
    h.render(Capture); await new Promise(setImmediate);
    let tree = h.render(Capture);
    const camera = nodes(tree, n => n.type === 'CameraView')[0];
    camera.props.ref.current = { getAvailablePictureSizesAsync: async () => ['1600x1200', '8000x6000'],
      takePictureAsync: async options => { assert.equal(options.skipProcessing, false); return { uri: 'file:///camera.jpg', base64 }; } };
    await camera.props.onCameraReady(); tree = h.render(Capture);
    const withText = (tree, type, text) => nodes(tree, n => n.type === type && nodes(n, c => c.type === 'Text' && c.props.children.includes(text)).length);
    await withText(tree, 'TouchableOpacity', 'Capture and Analyze')[0].props.onPress();
    tree = h.render(Capture);
    assert.equal(copies.length, 1);
    assert.equal(f.store.getWorksheetRecord('alice', w.instanceId).capture.answers.length, 5);
    assert.equal(withText(tree, 'TouchableOpacity', 'Open Teacher Review').length, 1);
    assert.equal(f.load('src/services/database/localMath.ts').isMathLessonCompleted('alice', 1), false);

    const r = hooks(), alerts = [];
    const loadReview = loader({ react: r.React,
      'react-native': { ...native, Alert: { alert: (...args) => alerts.push(args) }, Image: 'Image' },
      'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
      '@react-navigation/native': { useNavigation: () => navigation, useRoute: () => ({ params: { studentId: 'alice', instanceId: w.instanceId } }),
        useFocusEffect: fn => r.React.useEffect(fn, []) },
      [path.join(root, 'src/components/common/MotionTouchable.tsx')]: { __esModule: true, default: 'Button' },
      [path.join(root, 'src/services/session/session.ts')]: { getSession: async () => null },
      [path.join(root, 'src/services/student/studentLogin.ts')]: f.load('src/services/student/studentLogin.ts'),
      [path.join(root, 'src/services/teacher/teacherSession.ts')]: { getTeacherSession: async () => ({ teacherId: 'teacher' }) },
      [path.join(root, 'src/services/phygital/worksheetStore.ts')]: f.store,
      [path.join(root, 'src/services/sync/syncWorksheet.ts')]: f.load('src/services/sync/syncWorksheet.ts'),
    });
    const Review = loadReview('src/screens/phygital/WorksheetReviewScreen.tsx').default;
    r.render(Review); await new Promise(setImmediate); tree = r.render(Review);
    for (let i = 0; i < 5; i++) {
      await withText(tree, 'Button', w.questions[i].correctAnswer)[i].props.onPress();
      tree = r.render(Review);
    }
    await withText(tree, 'Button', 'Finalize Reviewed Result')[0].props.onPress();
    assert.equal(alerts.at(-1)[0], 'Result saved');
    assert.equal(f.store.getWorksheetRecord('alice', w.instanceId).finalized.score, 5);
    assert.equal(f.load('src/services/database/localMath.ts').isMathLessonUnlocked('alice', 2), true);
  } finally { f.raw.close(); }
});

test('an interrupted worksheet transaction leaves both result and progress pending for retry', async () => {
  const f = fixture();
  try {
    const w = f.store.issueWorksheet('alice', 'math', 1, crypto.randomUUID());
    f.store.saveWorksheetCapture('alice', w.instanceId, analyzeWorksheet(worksheetPhoto(w), w), 'file:///photo.jpg');
    f.store.saveWorksheetReview('alice', w.instanceId, { teacherId: 'teacher', answers: w.questions.map(q => q.correctAnswer), writing: [], reviewed: Array(5).fill(true) });
    f.store.finalizeWorksheet('alice', w.instanceId, 'teacher');
    const { syncWorksheet } = f.load('src/services/sync/syncWorksheet.ts');
    const before = structuredClone(f.cloud.get('students/alice'));
    f.interruptProgressUpload();
    await assert.rejects(syncWorksheet('alice', w.instanceId, () => true), /interrupted/);
    assert.equal(f.cloud.get('students/alice/worksheetResults/' + w.instanceId).finalized, undefined);
    assert.deepEqual(f.cloud.get('students/alice'), before);
    await syncWorksheet('alice', w.instanceId, () => true);
    assert.equal(f.cloud.get('students/alice').mathProgress['2'].unlocked, true);
    assert.equal([...f.cloud.keys()].filter(k => k.includes('worksheetResults')).length, 1);
    assert.equal(f.db.getFirstSync('SELECT coins FROM student WHERE id = ?', ['alice']).coins, 15);
  } finally { f.raw.close(); }
});

test('a stale offline review is archived and a teacher can review the latest revision without another reward', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  const w = f.store.issueWorksheet('alice', 'math', 1, crypto.randomUUID());
  const key = 'students/alice/worksheetResults/' + w.instanceId;
  const { syncWorksheet, restoreWorksheetHistory } = f.load('src/services/sync/syncWorksheet.ts');
  f.store.saveWorksheetCapture('alice', w.instanceId, analyzeWorksheet(worksheetPhoto(w), w), 'file:///original.jpg');
  await syncWorksheet('alice', w.instanceId);
  const observed = f.store.getWorksheetRecord('alice', w.instanceId);
  assert.equal(observed.captureRevision, 1);
  const mark = () => f.store.saveWorksheetReview('alice', w.instanceId, {
    teacherId: 'teacher', answers: w.questions.map(q => q.correctAnswer), writing: [], reviewed: Array(5).fill(true),
  });
  mark();
  const localFinal = f.store.finalizeWorksheet('alice', w.instanceId, 'teacher');
  const newer = { ...f.cloud.get(key).capture, answers: [null, ...observed.capture.answers.slice(1)] };
  f.cloud.set(key, { ...f.cloud.get(key), revision: 2, capture: newer });
  assert.equal(await syncWorksheet('alice', w.instanceId, () => true), 'blocked');
  assert.equal(f.cloud.get(key).finalized, undefined);
  assert.equal(f.store.getWorksheetRecord('alice', w.instanceId).syncConflict.revision, 2);
  f.cloud.set(key, { ...f.cloud.get(key), revision: 3 });
  await restoreWorksheetHistory('alice');
  assert.equal(f.store.getWorksheetRecord('alice', w.instanceId).syncConflict.revision, 3);
  f.store.loadLatestWorksheetDraft('alice', w.instanceId, 'teacher');
  const latest = f.store.getWorksheetRecord('alice', w.instanceId);
  assert.equal(latest.captureRevision, 3);
  assert.equal(latest.finalized, null);
  assert.equal(latest.review, null);
  const archived = JSON.parse(f.db.getFirstSync('SELECT snapshot FROM worksheet_review_archive WHERE studentId = ?', ['alice']).snapshot);
  assert.deepEqual(archived.finalized, localFinal);
  assert.equal(archived.photoUri, 'file:///original.jpg');
  mark();
  f.store.finalizeWorksheet('alice', w.instanceId, 'teacher');
  await syncWorksheet('alice', w.instanceId, () => true);
  await syncWorksheet('alice', w.instanceId, () => true);
  assert.equal(f.cloud.get(key).finalized.score, 5);
  assert.equal(f.cloud.get('students/alice').mathXP, 50);
  assert.equal(f.db.getFirstSync('SELECT coins FROM student WHERE id = ?', ['alice']).coins, 15);
});
