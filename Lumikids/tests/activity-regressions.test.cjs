const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loader, sqlite, hooks, nodes, native, root } = require('./runtime.cjs');

function fixture(filename, cloud = {}) {
  const storage = sqlite(filename);
  const uploads = [];
  const load = loader({
    'expo-sqlite': { openDatabaseSync: () => storage.db },
    [path.join(root, 'src/services/firebase/firebase.ts')]: { db: {} },
    'firebase/firestore': {
      doc: (_, ...parts) => parts.join('/'), serverTimestamp: () => 'timestamp',
      getDocFromServer: async () => ({ exists: () => true, data: () => cloud }),
      runTransaction: async (_, work) => {
        const writes = [];
        const result = await work({
          get: async () => ({ exists: () => true, data: () => cloud }),
          set: (ref, payload) => writes.push({ ref, payload }),
        });
        uploads.push(...writes);
        return result;
      },
    },
  });
  load('src/services/database/database.ts').initializeDatabase();
  const math = load('src/services/database/localMath.ts');
  for (const id of ['alice', 'bob']) {
    storage.db.runSync('INSERT OR IGNORE INTO student (id, name, classCode) VALUES (?, ?, ?)', [id, id, 'class']);
    math.initializeMathProgress(id);
  }
  return { ...storage, load, math, uploads };
}

test('Counting unlocks Addition; Addition unlocks Subtraction; entire curriculum advances in order', () => {
  const f = fixture();
  try {
    const { mathLessons } = f.load('src/data/mathLessons.ts');
    const { mathQuizzes } = f.load('src/data/mathQuizzes.ts');
    assert.deepEqual(f.db.getAllSync('SELECT lessonId FROM math_progress WHERE studentId = ? ORDER BY lessonId', ['alice'])
      .map(p => p.lessonId), mathLessons.map(l => String(l.id)));
    for (const [i, lesson] of mathLessons.entries()) {
      const total = mathQuizzes.filter(q => q.lessonId === lesson.id).length;
      assert.equal(f.math.isMathLessonUnlocked('alice', lesson.id), true);
      assert.equal(f.math.completeMathLesson('alice', lesson.id, total, total, 3, lesson.xpReward), true);
      assert.equal(f.math.isMathLessonCompleted('alice', lesson.id), true);
      if (mathLessons[i + 1]) {
        const next = mathLessons[i + 1].id;
        assert.equal(f.math.isMathLessonUnlocked('alice', next), true);
        assert.equal(f.math.getAllMathProgress('alice').find(p => Number(p.lessonId) === next).unlocked, 1);
      }
    }
    assert.equal(f.math.getAllMathProgress('alice').length, mathLessons.length);
  } finally { f.raw.close(); }
});

test('incomplete and failed assessments do not unlock; shared 75% rule is retained', () => {
  const f = fixture();
  try {
    assert.equal(f.math.completeMathLesson('alice', 2, 5, 5, 3, 60), false);
    assert.equal(f.math.isMathLessonCompleted('alice', 2), false);
    assert.equal(f.math.isMathLessonUnlocked('alice', 3), false);
    assert.throws(() => f.math.completeMathLesson('alice', 1, 1, 0, 3, 50), /Invalid/);
    assert.throws(() => f.math.completeMathLesson('alice', 99, 5, 5, 3, 50), /does not exist/);
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), false);
    f.math.saveMathQuizProgress('alice', 1, 3, 4);
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), false);
    assert.equal(f.db.getFirstSync('SELECT xp, coins FROM student WHERE id = ?', ['alice']).xp, 0);
    assert.equal(f.math.completeMathLesson('alice', 1, 2, 4, 0, 0), false);
    assert.equal(f.math.isMathLessonCompleted('alice', 1), false);
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), false);
    assert.equal(f.math.completeMathLesson('alice', 1, 3, 4, 2, 50), true);
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), true);
  } finally { f.raw.close(); }
});

test('legacy numeric/text ID aliases cannot hide completion, duplicate rewards, or reset unlocks', async () => {
  const cloud = { mathProgress: { '1': { unlocked: true }, '2': { unlocked: false } } };
  const f = fixture(undefined, cloud);
  try {
    // Expo binds JS numbers as doubles: TEXT affinity stores 1 as "1.0".
    f.db.runSync('INSERT OR REPLACE INTO math_progress (studentId, lessonId, unlocked, completed, stars, quizScore, quizTotal, xpEarned) VALUES (?, ?, 1, 1, 3, 10, 10, 50)', ['alice', 1]);
    f.db.runSync('INSERT OR REPLACE INTO math_progress (studentId, lessonId, unlocked) VALUES (?, ?, 1)', ['alice', 2]);
    f.db.runSync('INSERT OR REPLACE INTO math_progress (studentId, lessonId, unlocked) VALUES (?, ?, 0)', ['alice', '2']);
    await f.load('src/services/sync/restoreStudentProgress.ts').restoreStudentProgress('alice');
    assert.equal(f.math.isMathLessonCompleted('alice', 1), true);
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), true);
    const rows = f.math.getAllMathProgress('alice');
    assert.equal(rows.filter(row => Number(row.lessonId) === 2).length, 1);
    assert.equal(rows.find(row => Number(row.lessonId) === 2).unlocked, 1);
    f.math.completeMathLesson('alice', 1, 10, 10, 3, 50);
    assert.equal(f.db.getFirstSync('SELECT xp, coins FROM student WHERE id = ?', ['alice']).xp, 0);
  } finally { f.raw.close(); }
});

test('restart, account switching, stale cloud restore and queued upload retain offline unlocks', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumikids-math-'));
  const filename = path.join(dir, 'progress.db');
  let f = fixture(filename);
  try {
    f.math.completeMathLesson('alice', 1, 10, 10, 3, 50);
    f.raw.close();
    f = fixture(filename, { mathProgress: { '1': { completed: false }, '2': { unlocked: false } } });
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), true);
    assert.equal(f.math.isMathLessonUnlocked('bob', 2), false);
    await f.load('src/services/sync/processQueue.ts').processQueue();
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), true);
    assert.equal(f.math.isMathLessonUnlocked('bob', 2), false);
    assert.equal(f.uploads[0].ref, 'students/alice');
    assert.equal(f.uploads[0].payload.mathProgress['2'].unlocked, true);
    assert.equal(f.db.getFirstSync('SELECT COUNT(*) AS n FROM sync_queue WHERE synced = 0').n, 0);
    f.math.completeMathLesson('alice', 1, 10, 10, 3, 50);
    const student = f.db.getFirstSync('SELECT xp, mathXP, coins FROM student WHERE id = ?', ['alice']);
    assert.deepEqual({ ...student }, { xp: 50, mathXP: 50, coins: 15 });
  } finally { f.raw.close(); fs.rmSync(dir, { recursive: true }); }
});

test('completion, unlock, rewards and queue roll back together after a write failure', () => {
  const f = fixture();
  try {
    f.db.execSync("CREATE TRIGGER fail_coins BEFORE UPDATE OF coins ON student BEGIN SELECT RAISE(ABORT, 'injected reward failure'); END;");
    assert.throws(() => f.math.completeMathLesson('alice', 1, 10, 10, 3, 50), /injected reward failure/);
    assert.equal(f.math.isMathLessonCompleted('alice', 1), false);
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), false);
    assert.equal(f.db.getFirstSync('SELECT xp FROM student WHERE id = ?', ['alice']).xp, 0);
    assert.equal(f.db.getFirstSync('SELECT COUNT(*) AS n FROM sync_queue').n, 0);
    f.db.execSync('DROP TRIGGER fail_coins');
    f.math.completeMathLesson('alice', 1, 10, 10, 3, 50);
    assert.equal(f.db.getFirstSync('SELECT xp FROM student WHERE id = ?', ['alice']).xp, 50);
  } finally { f.raw.close(); }
});

test('the real digital Math quiz handlers persist completion and award once, including replay', async () => {
  const f = fixture();
  try {
    async function play(lessonId) {
      const h = hooks(), routes = [];
      const navigation = { replace: (name, params) => routes.push({ name, params }), goBack() {} };
      const componentMock = name => ({ __esModule: true, default: name });
      const load = loader({ react: h.React, 'react-native': native,
        'expo-sqlite': { openDatabaseSync: () => f.db },
        '@react-navigation/native': { useNavigation: () => navigation, useRoute: () => ({ params: { lessonId } }) },
        'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
        'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
        [path.join(root, 'src/services/session/session.ts')]: { getSession: async () => ({ studentId: 'alice' }) },
        [path.join(root, 'src/services/database/localMath.ts')]: f.math,
        [path.join(root, 'src/hooks/useExitLessonGuard.ts')]: {
          useExitLessonGuard: () => ({ visible: false, requestExit() {}, stay() {}, leave() {} }),
        },
        ...Object.fromEntries(['MotionTouchable', 'FadeIn', 'AnimatedProgress', 'ExitLessonModal'].map(name => [
          path.join(root, 'src/components/common/' + name + '.tsx'),
          componentMock(name === 'MotionTouchable' ? 'TouchableOpacity' : name),
        ])),
      });
      const Screen = load('src/screens/math/MathQuizScreen.tsx').default;
      const questions = f.load('src/data/mathQuizzes.ts').mathQuizzes.filter(q => q.lessonId === lessonId);
      let tree = h.render(Screen);
      const button = text => nodes(tree, n => n.type === 'TouchableOpacity' &&
        nodes(n, child => child.type === 'Text' && child.props.children.includes(text)).length)[0];
      for (const [i, question] of questions.entries()) {
        await button(question.correctAnswer).props.onPress();
        tree = h.render(Screen);
        await button(i === questions.length - 1 ? 'Finish Quiz 🎉' : 'Next →').props.onPress();
        tree = h.render(Screen);
      }
      assert.equal(routes.at(-1).name, 'MathResult');
      return routes.at(-1).params;
    }
    assert.equal((await play(1)).xp, 50);
    assert.equal(f.math.isMathLessonUnlocked('alice', 2), true);
    assert.equal((await play(1)).xp, 0);
    assert.equal((await play(2)).xp, 60);
    assert.equal(f.math.isMathLessonUnlocked('alice', 3), true);
    assert.deepEqual({ ...f.db.getFirstSync('SELECT xp, mathXP, coins FROM student WHERE id = ?', ['alice']) },
      { xp: 110, mathXP: 110, coins: 30 });
  } finally { f.raw.close(); }
});

test('Writing component opens and draws with installed Skia; taps, strokes, reset and next-letter still validate', async () => {
  const CK = await require('canvaskit-wasm/bin/full/canvaskit.js')();
  const skiaDir = '../node_modules/@shopify/react-native-skia/lib/commonjs/skia/web/';
  const { JsiSkPathFactory } = require(skiaDir + 'JsiSkPathFactory');
  const { JsiSkPathBuilderFactory } = require(skiaDir + 'JsiSkPathBuilderFactory');
  const h = hooks();
  const load = loader({ react: h.React, 'react-native': native,
    '@shopify/react-native-skia': { Canvas: 'Canvas', Path: 'Path', DashPathEffect: 'DashPathEffect',
      Skia: { Path: new JsiSkPathFactory(CK), PathBuilder: new JsiSkPathBuilderFactory(CK) } },
  });
  const Component = load('src/components/writing/TracingCanvas.tsx').default;
  const { writingStrokeTemplates } = load('src/data/writingStrokeTemplates.ts');
  const completions = [], drawing = [];
  const props = { target: 'Aa', resetKey: 0, onPhaseComplete: v => completions.push(v),
    onDrawingStart: () => drawing.push(true), onDrawingEnd: () => drawing.push(false) };
  let tree = h.render(Component, props);
  tree.props.onLayout({ nativeEvent: { layout: { width: 320, height: 390 } } });
  tree = h.render(Component, props);
  tree = h.render(Component, props);
  const handlers = nodes(tree, n => n.props?.onPanResponderGrant)[0].props;
  function draw(points) {
    const event = p => ({ nativeEvent: { locationX: p.x, locationY: p.y } });
    handlers.onPanResponderGrant(event(points[0]));
    h.render(Component, props); // Includes the formerly failing user-path render.
    for (const p of points.slice(1, -1)) handlers.onPanResponderMove(event(p));
    handlers.onPanResponderRelease(event(points.at(-1)));
    tree = h.render(Component, props);
  }
  draw([{ x: 0, y: 0 }, { x: 0, y: 0 }]);
  assert.equal(completions.at(-1), false);
  for (const letter of ['A', 'a']) {
    for (const stroke of writingStrokeTemplates[letter]) {
      const points = stroke.flatMap((p, i) => i ? Array.from({ length: 12 }, (_, j) => ({
        x: (stroke[i - 1].x + (p.x - stroke[i - 1].x) * (j + 1) / 12) * 320,
        y: (stroke[i - 1].y + (p.y - stroke[i - 1].y) * (j + 1) / 12) * 390,
      })) : [{ x: p.x * 320, y: p.y * 390 }]);
      draw(points);
    }
    if (letter === 'A') {
      assert.equal(completions.at(-1), false);
      nodes(tree, n => n.type === 'TouchableOpacity')[0].props.onPress();
      tree = h.render(Component, props);
    }
  }
  assert.equal(completions.at(-1), true);
  assert.ok(drawing.includes(true));
  assert.equal(drawing.at(-1), false);
  for (const n of nodes(tree, n => n.type === 'Path')) {
    assert.equal(n.props.path.__typename__, 'Path');
    assert.ok(n.props.path.toSVGString().length > 0);
  }
  props.resetKey++;
  h.render(Component, props);
  assert.equal(completions.at(-1), false);
});
