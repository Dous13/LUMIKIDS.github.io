const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loader, sqlite, hooks, nodes, native, root } = require('./runtime.cjs');
const { fakeFirebase, quizProof, traceProof } = require('./cloud-fixture.cjs');

const profile = (id, overrides) => ({
  id, name: id, classCode: 'ROOM', teacherId: 'teacher', xp: 0, coins: 30,
  readingXP: 0, writingXP: 0, mathXP: 0, avatar: 'default', ...overrides,
});
const expiration = () => new Date(Date.now() + 3_600_000).toISOString();

function fixture(options = {}) {
  const storage = sqlite(options.filename);
  options.beforeMigration?.(storage.db);
  const cloud = options.cloud ?? new Map([
    ['classes/ROOM', { code: 'ROOM', teacherId: 'teacher' }],
    ['students/alice', { ...profile('alice'), preferredNameLower: 'alice' }],
    ['students/bob', { ...profile('bob'), preferredNameLower: 'bob' }],
    ['classes/ROOM/students/alice', { ...profile('alice'), preferredNameLower: 'alice' }],
    ['classes/ROOM/students/bob', { ...profile('bob'), preferredNameLower: 'bob' }],
  ]);
  let offline = false;
  let failAfterCommit = false;
  let beforeCommit;
  const writes = [];
  const reads = [];
  const sessions = options.sessions ?? new Map();
  const auth = { currentUser: null, async signOut() { this.currentUser = null; } };
  const network = () => {
    if (offline) throw Object.assign(new Error('offline'), { code: 'unavailable' });
  };
  const firebase = fakeFirebase(cloud, { auth, network, onLearning: options.onLearning, async commit(transactionWrites) {
    const pause = beforeCommit;
    beforeCommit = undefined;
    if (pause) await pause();
    network();
    for (const [ref, value] of transactionWrites) cloud.set(ref, { ...cloud.get(ref), ...value });
    writes.push(transactionWrites);
    if (failAfterCommit) {
      failAfterCommit = false;
      throw new Error('connection dropped after commit');
    }
  } });
  const load = loader({
    'expo-sqlite': { openDatabaseSync: () => storage.db },
    [path.join(root, 'src/services/firebase/firebase.ts')]: { auth, db: {} },
    '@react-native-async-storage/async-storage': {
      getItem: async key => sessions.get(key) ?? null,
      setItem: async (key, value) => { sessions.set(key, value); },
      removeItem: async key => { sessions.delete(key); },
    },
    'firebase/auth': firebase.authMock,
    'firebase/functions': firebase.functionsMock,
    'firebase/firestore': {
      doc: (_, ...parts) => parts.join('/'),
      collection: (_, ...parts) => parts.join('/'),
      getDocFromServer: async ref => { network(); reads.push(ref); return firebase.getStudent(ref); },
      getDocsFromServer: async ref => {
        network(); reads.push(ref);
        return { docs: [...cloud].filter(([key]) => key.startsWith(ref + '/'))
          .map(([key, data]) => ({ id: key.split('/').at(-1), data: () => structuredClone(data) })) };
      },
    },
  });
  const service = name => load('src/services/' + name + '.ts');
  service('database/database').initializeDatabase();
  return {
    ...storage, cloud, writes, reads, sessions, auth, service,
    login: (name, code = 'ROOM', remember = true) => service('student/studentLogin').loginStudent(name, code, remember),
    restore: id => service('sync/restoreStudentProgress').restoreStudentProgress(id),
    getSession: () => service('session/session').getSession(),
    student: id => service('database/localStudent').getLocalStudent(id),
    queue: () => service('sync/localQueue').getPendingQueue(),
    offline(value) { offline = value; },
    loseAcknowledgement() { failAfterCommit = true; },
    beforeCommit(task) { beforeCommit = task; },
  };
}

function progress(f) {
  return {
    reading: f.service('database/localProgress'),
    writing: f.service('database/localWriting'),
    math: f.service('database/localMath'),
  };
}

function tempDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lumikids-offline-'));
  return path.join(directory, 'saved.db');
}

test('verified login merges pending rewards, signed spending and mascot ownership across logout, restart and account switching', async t => {
  const filename = tempDatabase();
  let f = fixture({ filename });
  t.after(() => {
    f.raw.close();
    fs.rmSync(path.dirname(filename), { recursive: true, force: true });
  });
  await f.login('alice');
  assert.deepEqual(await f.getSession(), { studentId: 'alice' });
  const { reading, writing, math } = progress(f);
  const mascots = f.service('database/localMascot');
  f.offline(true);
  assert.deepEqual(await f.getSession(), { studentId: 'alice' });
  assert.equal(reading.saveReadingAssessment('alice', 'A', 4, 4, false, quizProof('reading', 'A')).rewarded, true);
  assert.equal(writing.completeWritingLesson('alice', 'A', 3, false, traceProof('A')).rewarded, true);
  assert.equal(math.completeMathLesson('alice', 1, 10, 10, 3, 50, false, quizProof('math', 1)), true);
  assert.equal(mascots.buyMascot('alice', 'fox', 50), 'purchased');
  assert.equal(mascots.buyMascot('alice', 'fox', 50), 'owned');
  f.service('database/localStudent').equipMascot('alice', 'fox');
  const before = f.student('alice');
  assert.ok(before.coins < 30, 'purchase reduced the stale cloud balance');
  await f.service('session/session').clearSession();
  assert.equal(await f.getSession(), null);
  await assert.rejects(f.login('alice'), /Connect to the internet/);
  assert.equal(await f.getSession(), null);

  const cloud = f.cloud;
  // An independent cloud award and mascot should survive the same merge.
  cloud.set('students/alice', profile('alice', {
    xp: 12, mathXP: 12, ownedMascots: ['default', 'cat'], name: 'Alice updated online',
  }));
  f.raw.close();
  f = fixture({ filename, cloud });
  assert.equal(await f.getSession(), null);
  await f.login('bob');
  assert.equal(f.student('bob').coins, 30);
  const other = progress(f);
  assert.equal(other.reading.isLessonCompleted('bob', 'A'), false);
  assert.equal(other.writing.isWritingLessonCompleted('bob', 'A'), false);
  assert.equal(other.math.isMathLessonCompleted('bob', 1), false);
  assert.deepEqual(f.service('database/localMascot').getOwnedMascots('bob').map(row => row.mascotId), ['default']);
  await f.service('session/session').clearSession();
  await f.login('alice');
  const restored = f.student('alice');
  assert.deepEqual(
    [restored.name, restored.classCode, restored.xp, restored.readingXP, restored.writingXP, restored.mathXP, restored.coins, restored.avatar],
    ['Alice updated online', 'ROOM', before.xp + 12, before.readingXP, before.writingXP, before.mathXP + 12, before.coins, 'fox'],
  );
  assert.equal(restored.level, loader()('src/utils/xp.ts').getLevel(restored.xp));
  assert.deepEqual(f.service('database/localMascot').getOwnedMascots('alice').map(row => row.mascotId).sort(), ['cat', 'default', 'fox']);
  assert.equal(other.reading.isLessonCompleted('alice', 'A'), true);
  assert.equal(other.writing.isWritingLessonCompleted('alice', 'A'), true);
  assert.equal(other.math.isMathLessonCompleted('alice', 1), true);
  await f.restore('alice');
  assert.deepEqual(f.student('alice'), restored);
  f.cloud.set('students/alice', profile('alice', { classCode: 'OTHER' }));
  await assert.rejects(f.restore('alice'), /classroom/);
  assert.deepEqual(f.student('alice'), restored);
});

test('legacy migration preserves pending local balance, avatar and XP and tolerates malformed queue rows', async t => {
  const f = fixture({
    beforeMigration(db) {
      db.execSync("CREATE TABLE student (id TEXT PRIMARY KEY, name TEXT, classCode TEXT, xp INTEGER, readingXP INTEGER, writingXP INTEGER, mathXP INTEGER, coins INTEGER, level INTEGER, streak INTEGER, avatar TEXT)");
      db.execSync("INSERT INTO student VALUES ('alice', 'Alice', 'ROOM', 75, 20, 5, 50, 8, 1, 0, 'panda')");
      db.execSync("CREATE TABLE sync_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, payload TEXT NOT NULL, createdAt INTEGER, synced INTEGER DEFAULT 0, retryCount INTEGER DEFAULT 0)");
      db.runSync("INSERT INTO sync_queue (action, payload) VALUES (?, ?), (?, ?)", ['SYNC_STUDENT', '{bad', 'SYNC_STUDENT', '{"studentId":"alice"}']);
      db.execSync("CREATE TABLE owned_mascots (studentId TEXT, mascotId TEXT, PRIMARY KEY(studentId, mascotId))");
      db.execSync("INSERT INTO owned_mascots VALUES ('alice', 'panda')");
    },
  });
  t.after(() => f.raw.close());
  await f.login('alice');
  await f.restore('alice');
  f.service('database/database').initializeDatabase();
  const student = f.student('alice');
  assert.deepEqual([student.xp, student.readingXP, student.writingXP, student.mathXP, student.coins, student.level, student.avatar], [75, 20, 5, 50, 8, 4, 'panda']);
  await f.service('sync/processQueue').processQueue();
  assert.equal(f.cloud.get('students/alice').coins, 30);
  assert.equal(f.student('alice').coins, 30);
  assert.equal(f.student('alice').avatar, 'default');
  assert.equal(f.student('alice').xp, 75);
  assert.deepEqual(JSON.parse(f.db.getFirstSync("SELECT legacyProfile FROM student_profile_sync WHERE studentId = 'alice'").legacyProfile),
    { xp: 75, readingXP: 20, writingXP: 5, mathXP: 50 });
  assert.equal(f.cloud.get('classes/ROOM/students/alice').avatar, 'default');
  assert.equal(f.queue().length, 2);
  assert.equal(f.queue()[0].payload, '{bad');
});

test('a migrated wallet adopts a newer cloud balance, preserves offline purchases on failure and settles a lost acknowledgement once', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const { buyMascot } = f.service('database/localMascot');
  const { equipMascot } = f.service('database/localStudent');
  const { processQueue } = f.service('sync/processQueue');
  const state = () => f.db.getFirstSync("SELECT legacyProfile FROM student_profile_sync WHERE studentId = 'alice'");
  f.db.runSync("INSERT OR REPLACE INTO student_profile_sync (studentId, legacyProfile) VALUES ('alice', ?)",
    [JSON.stringify({ coins: 30, avatar: 'default' })]);
  f.cloud.set('students/alice', { ...f.cloud.get('students/alice'), profileRevision: 5, coins: 90, avatar: 'cat', ownedMascots: ['default', 'cat'] });
  f.offline(true);
  assert.equal(buyMascot('alice', 'frog', 25), 'purchased');
  equipMascot('alice', 'frog');
  await assert.rejects(f.login('alice'), /Connect to the internet/);
  await processQueue();
  assert.deepEqual([f.student('alice').coins, f.student('alice').avatar], [5, 'frog']);
  assert.ok(state().legacyProfile);
  f.offline(false);
  await f.login('alice');
  f.loseAcknowledgement();
  await processQueue();
  assert.equal(f.cloud.get('students/alice').coins, 65);
  assert.ok(state().legacyProfile);
  assert.equal(f.queue().length, 1);
  await processQueue();
  assert.deepEqual([f.student('alice').coins, f.student('alice').avatar], [65, 'frog']);
  assert.equal(f.cloud.get('students/alice').coins, 65);
  assert.equal(f.cloud.get('students/alice').ownedMascots.filter(id => id === 'frog').length, 1);
  assert.equal(state().legacyProfile, null);
  assert.equal(f.queue().length, 0);
  await f.service('sync/restoreStudentProgress').restoreStudentSnapshot('alice', profile('alice', { coins: 90, profileRevision: 5, avatar: 'cat' }));
  assert.deepEqual([f.student('alice').coins, f.student('alice').avatar], [65, 'frog']);
});

test('a full rejected batch stays in SQLite without starving or retrying past later valid entries', async t => {
  const attempts = [];
  const f = fixture({ onLearning: batch => attempts.push(batch) });
  t.after(() => f.raw.close());
  await f.login('alice');
  const { processQueue } = f.service('sync/processQueue');
  for (let i = 0; i < 24; i++) {
    f.db.runSync("INSERT INTO student_profile_changes (studentId, operation) VALUES ('alice', ?)", [JSON.stringify({ type: 'invalid' })]);
  }
  progress(f).reading.saveReadingAssessment('alice', 'A', 4, 4, false, quizProof('reading', 'A'));
  await processQueue();
  assert.deepEqual(attempts.map(batch => batch.length), [24, 1]);
  assert.equal(f.cloud.get('students/alice').readingProgress.A.completed, true);
  assert.equal(f.db.getFirstSync("SELECT COUNT(*) AS n FROM student_profile_changes WHERE syncRejection = 'invalid-operation'").n, 24);
  assert.equal(f.queue().length, 1);
  await processQueue();
  assert.equal(attempts.length, 2);
  progress(f).reading.saveReadingAssessment('alice', 'B', 4, 4, false, quizProof('reading', 'B'));
  await processQueue();
  assert.deepEqual(attempts.map(batch => batch.length), [24, 1, 1]);
  assert.equal(f.cloud.get('students/alice').readingProgress.B.completed, true);
  assert.equal(f.db.getFirstSync("SELECT COUNT(*) AS n FROM student_profile_changes WHERE syncRejection = 'invalid-operation'").n, 24);
});

test('a purchase missing its server funding is retried after unrelated rewards clear the dependency', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const { processQueue } = f.service('sync/processQueue');
  f.cloud.set('students/alice', { ...f.cloud.get('students/alice'), coins: 24 });
  assert.equal(f.service('database/localMascot').buyMascot('alice', 'frog', 25), 'purchased');
  progress(f).reading.saveReadingAssessment('alice', 'A', 4, 4, false, quizProof('reading', 'A'));
  await processQueue();
  assert.equal(f.cloud.get('students/alice').readingProgress.A.completed, true);
  assert.equal(f.db.getFirstSync("SELECT syncRejection FROM student_profile_changes").syncRejection, null);
  await processQueue();
  assert.ok(f.cloud.get('students/alice').ownedMascots.includes('frog'));
  assert.equal(f.queue().length, 0);
});

test('queue retains invalid jobs, missing records and offline failures and processes each authorized job serially', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  await f.restore('bob');
  progress(f).reading.saveReadingAssessment('alice', 'A', 4, 4, false, quizProof('reading', 'A'));
  const { addToSyncQueue } = f.service('sync/localQueue');
  const { processQueue } = f.service('sync/processQueue');
  const { syncStudent } = f.service('sync/syncStudent');
  addToSyncQueue('UNKNOWN', { studentId: 'alice' });
  addToSyncQueue('SYNC_STUDENT', { studentId: 'missing-local' });
  addToSyncQueue('SYNC_WORKSHEET', { studentId: 'alice', instanceId: 'missing-copy' });
  f.db.runSync("INSERT INTO sync_queue (action, payload) VALUES ('SYNC_STUDENT', '[]')");
  addToSyncQueue('SYNC_STUDENT', { studentId: 'alice' });
  assert.equal(f.queue().filter(job => job.action === 'SYNC_STUDENT' && JSON.parse(job.payload)?.studentId === 'alice').length, 1);
  await assert.rejects(syncStudent('missing-local'), /not found on this device/);
  const original = f.cloud.get('students/bob');
  f.cloud.delete('students/bob');
  await assert.rejects(syncStudent('bob'), /cloud student profile does not exist/);
  f.cloud.set('students/bob', original);
  f.offline(true);
  const numPending = f.queue().length;
  await processQueue(id => id === 'alice');
  assert.equal(f.queue().length, numPending);
  assert.equal(f.writes.length, 0);

  f.offline(false);
  const first = processQueue(id => id === 'alice');
  assert.equal(processQueue(id => id === 'alice'), first);
  await first;
  assert.equal(f.writes.filter(writes => writes.some(([ref]) => ref === 'students/alice')).length, 1);
  assert.ok(f.queue().some(job => job.payload.includes('bob')));
  assert.ok(f.queue().some(job => job.action === 'UNKNOWN'));
  assert.ok(f.queue().some(job => job.payload.includes('missing-local')));
  assert.ok(f.queue().some(job => job.payload.includes('missing-copy')));
  assert.ok(f.queue().some(job => job.payload === '[]'));
  await processQueue(id => id === 'bob');
  assert.ok(!f.queue().some(job => job.payload.includes('bob')));
});

test('lost acknowledgement and edits during upload preserve spending and rewards after restart', async t => {
  const filename = tempDatabase();
  let f = fixture({ filename });
  t.after(() => {
    f.raw.close();
    fs.rmSync(path.dirname(filename), { recursive: true, force: true });
  });
  await f.login('alice');
  const { reading } = progress(f);
  assert.equal(reading.saveReadingAssessment('alice', 'A', 4, 4, false, quizProof('reading', 'A')).rewarded, true);
  assert.equal(f.service('database/localMascot').buyMascot('alice', 'frog', 25), 'purchased');
  const initial = f.student('alice');
  f.beforeCommit(async () => {
    assert.equal(reading.saveReadingAssessment('alice', 'B', 4, 4, false, quizProof('reading', 'B')).rewarded, true);
    f.service('database/localStudent').equipMascot('alice', 'frog');
    f.loseAcknowledgement();
  });
  await f.service('sync/processQueue').processQueue();
  assert.equal(f.cloud.get('students/alice').coins, initial.coins);
  assert.equal(f.cloud.get('classes/ROOM/students/alice').coins, initial.coins);
  assert.equal(f.cloud.get('students/alice').avatar, 'default');
  assert.ok(f.queue().length > 0);
  const expected = f.student('alice');
  const cloud = f.cloud;
  f.raw.close();
  f = fixture({ filename, cloud });
  await f.login('alice');
  assert.equal(f.student('alice').coins, expected.coins);
  await f.service('sync/processQueue').processQueue();
  assert.deepEqual(f.student('alice'), expected);
  assert.equal(f.cloud.get('students/alice').xp, expected.xp);
  assert.equal(f.cloud.get('students/alice').coins, expected.coins);
  assert.equal(f.cloud.get('students/alice').avatar, 'frog');
  assert.equal(f.queue().length, 0);
  assert.equal(f.db.getFirstSync('SELECT COUNT(*) AS n FROM student_profile_changes').n, 0);
});

test('successful upload acknowledges only its snapshot when a newer local edit arrives', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  progress(f).reading.saveReadingAssessment('alice', 'A', 4, 4, false, quizProof('reading', 'A'));
  f.beforeCommit(async () => {
    progress(f).reading.saveReadingAssessment('alice', 'B', 4, 4, false, quizProof('reading', 'B'));
    f.service('database/localMascot').buyMascot('alice', 'frog', 25);
  });
  const { processQueue } = f.service('sync/processQueue');
  await processQueue();
  assert.equal(f.cloud.get('students/alice').xp, 25);
  assert.equal(f.queue().length, 1);
  assert.equal(f.db.getFirstSync("SELECT synced FROM lesson_progress WHERE studentId = 'alice' AND lessonId = 'B'").synced, 0);
  f.db.runSync("INSERT INTO sync_queue (action, payload) VALUES (?, ?)", ['SYNC_STUDENT', '{"studentId":"alice"}']);
  assert.equal(f.queue().length, 2);
  await processQueue();
  assert.equal(f.queue().length, 0);
  assert.equal(f.cloud.get('students/alice').xp, f.student('alice').xp);
  assert.equal(f.cloud.get('students/alice').coins, f.student('alice').coins);
});

test('a confirmed profile revision protects spent coins and equipment from an older cloud snapshot', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const original = f.cloud.get('students/alice');
  f.service('database/localMascot').buyMascot('alice', 'frog', 25);
  f.service('database/localStudent').equipMascot('alice', 'frog');
  const { processQueue } = f.service('sync/processQueue');
  await processQueue();
  const synced = f.cloud.get('students/alice');
  assert.equal(synced.coins, 5);
  assert.equal(synced.avatar, 'frog');
  f.cloud.set('students/alice', original);
  await f.restore('alice');
  assert.equal(f.student('alice').coins, 5);
  assert.equal(f.student('alice').avatar, 'frog');
  await processQueue();
  assert.equal(f.cloud.get('students/alice').coins, original.coins);
  assert.equal(f.student('alice').coins, 5);
  assert.equal(f.student('alice').avatar, 'frog');
});

test('two devices completing the same lesson or purchasing the same mascot converge without a second award or debit', async t => {
  const a = fixture(), b = fixture({ cloud: a.cloud });
  t.after(() => { a.raw.close(); b.raw.close(); });
  for (const device of [a, b]) {
    await device.login('alice');
    assert.equal(progress(device).math.completeMathLesson('alice', 1, 10, 10, 3, 50, false, quizProof('math', 1)), true);
    assert.equal(device.service('database/localMascot').buyMascot('alice', 'frog', 25), 'purchased');
  }
  await a.service('sync/processQueue').processQueue();
  const cloud = a.cloud.get('students/alice');
  // A legacy installation may have written a numeric-alias progress key.
  a.cloud.set('students/alice', { ...cloud, mathProgress: { '1.0': cloud.mathProgress['1'] } });
  await b.service('sync/processQueue').processQueue();
  assert.deepEqual([b.student('alice').xp, b.student('alice').mathXP, b.student('alice').coins], [50, 50, 20]);
  assert.deepEqual([a.cloud.get('students/alice').xp, a.cloud.get('students/alice').coins], [50, 20]);
});

test('paired Reading and Math attempts resist weaker digital results, alias rows, and stale cloud data', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const { reading, math } = progress(f);
  reading.saveReadingAssessment('alice', 'A', 5, 5);
  reading.saveReadingAssessment('alice', 'A', 4, 5);
  reading.saveReadingAssessment('alice', 'A', 1, 4);
  math.completeMathLesson('alice', 1, 5, 5, 3, 50);
  math.completeMathLesson('alice', 1, 8, 10, 2, 0);
  f.db.runSync("INSERT INTO math_progress (studentId, lessonId, quizScore, quizTotal) VALUES (?, ?, ?, ?)", ['alice', '1.0', 4, 8]);
  f.db.runSync("INSERT INTO math_progress (studentId, lessonId, quizScore, quizTotal) VALUES (?, ?, ?, ?)", ['alice', '2.0', 3, 0]);
  f.cloud.set('students/alice', profile('alice', {
    readingProgress: { A: { quizScore: 4, quizTotal: 10 }, B: { quizScore: 3, completed: true } },
    mathProgress: { '1.0': { quizScore: 4, quizTotal: 10 } },
  }));
  await f.restore('alice');
  const assertPair = (attempt, score, total) => assert.deepEqual([attempt.quizScore, attempt.quizTotal], [score, total]);
  assertPair(reading.getLessonProgress('alice', 'A'), 5, 5);
  assert.equal(reading.getLessonProgress('alice', 'A').stars, 3);
  assertPair(reading.getLessonProgress('alice', 'B'), 3, 0);
  assertPair(math.getMathProgress('alice', 1), 5, 5);
  assertPair(math.getMathProgress('alice', 2), 3, 0);
  f.cloud.set('students/alice', profile('alice', {
    readingProgress: { A: { quizScore: 10, quizTotal: 10 } },
    mathProgress: { '1': { quizScore: 10, quizTotal: 10 } },
  }));
  await f.restore('alice');
  assertPair(reading.getLessonProgress('alice', 'A'), 10, 10);
  assertPair(math.getMathProgress('alice', 1), 10, 10);
});

test('Reading completion rolls back on queue failure and a replay pays only once', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const { processQueue } = f.service('sync/processQueue');
  await processQueue();
  const reading = progress(f).reading;
  const student = f.student('alice');
  f.db.execSync("CREATE TRIGGER fail_reading_queue BEFORE INSERT ON sync_queue BEGIN SELECT RAISE(ABORT, 'injected queue failure'); END");
  assert.throws(() => reading.saveReadingAssessment('alice', 'A', 4, 4), /injected queue failure/);
  assert.equal(reading.getLessonProgress('alice', 'A').completed, 0);
  assert.equal(reading.getLessonProgress('alice', 'A').quizTotal, 0);
  assert.equal(reading.getLessonProgress('alice', 'B').unlocked, 0);
  assert.deepEqual(f.student('alice'), student);
  assert.equal(f.db.getFirstSync('SELECT COUNT(*) AS n FROM student_profile_changes').n, 0);
  f.db.execSync('DROP TRIGGER fail_reading_queue');
  assert.equal(reading.saveReadingAssessment('alice', 'A', 4, 4).rewarded, true);
  assert.equal(reading.getLessonProgress('alice', 'B').unlocked, 1);
  const rewarded = f.student('alice');
  assert.equal(reading.saveReadingAssessment('alice', 'A', 3, 4).rewarded, false);
  assert.deepEqual(f.student('alice'), rewarded);
});

test('a fresh session requires verified enrollment, and expiry, revocation and account switching invalidate it', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await assert.rejects(f.login('unregistered'), /could not verify/);
  f.cloud.set('classes/ROOM/students/unlinked', { ...profile('unlinked', { classCode: 'OTHER' }), preferredNameLower: 'unlinked' });
  await assert.rejects(f.login('unlinked'), /could not verify/);
  f.cloud.set('classes/ROOM/students/missing', { ...profile('missing'), preferredNameLower: 'missing' });
  await assert.rejects(f.login('missing'), /could not verify/);
  assert.equal(await f.getSession(), null);
  await f.login('alice');
  const { refreshStudentSession, canSyncStudentSession } = f.service('student/studentLogin');
  assert.equal(canSyncStudentSession('alice'), true);
  await f.login('bob');
  assert.deepEqual(await f.getSession(), { studentId: 'bob' });
  assert.equal(canSyncStudentSession('alice'), false);
  const originalClock = Date.now;
  const { expiresAt } = JSON.parse(f.sessions.get('studentSession'));
  Date.now = () => expiresAt + 1;
  try {
    f.offline(true);
    assert.equal(await f.getSession(), null);
    assert.equal(canSyncStudentSession('bob'), false);
    assert.equal(canSyncStudentSession('bob'), false);
  } finally { Date.now = originalClock; }
  f.offline(false);
  await f.login('bob');
  f.cloud.delete('classes/ROOM/students/bob');
  const now = Date.now();
  Date.now = () => now + 6 * 60_000;
  try {
    await refreshStudentSession();
    assert.deepEqual(await f.getSession(), { studentId: 'bob' });
    assert.equal(canSyncStudentSession('bob'), false);
    assert.equal(f.auth.currentUser, null);
  } finally { Date.now = originalClock; }
  await assert.rejects(f.login('bob'), /could not verify/);
});

test('registered name and classroom code use the same custom-token identity without duplicate student records', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  const keys = [...f.cloud.keys()];
  await f.login('  ALIce  ', '  rOoM ');
  assert.deepEqual(await f.getSession(), { studentId: 'alice' });
  assert.equal(f.auth.currentUser.uid, 'student:alice');
  assert.equal(f.student('alice').classCode, 'ROOM');
  await f.login('Alice', 'ROOM');
  assert.deepEqual(await f.getSession(), { studentId: 'alice' });
  assert.deepEqual([...f.cloud.keys()], keys);
  assert.equal(f.writes.length, 0);
  assert.equal(f.db.getFirstSync('SELECT COUNT(*) AS count FROM student').count, 1);
});

test('the login screen submits Student Name and Classroom Code and opens Home on success', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  const ui = hooks();
  const routes = [];
  const navigation = { reset: state => routes.push(state.routes[0].name) };
  const screen = loader({
    react: ui.React,
    'react-native': { ...native, Animated: { View: 'View' }, Platform: { OS: 'ios' }, Image: 'Image',
      KeyboardAvoidingView: 'View', Switch: 'Switch' },
    '@react-navigation/native': { useNavigation: () => navigation },
    'react-native-safe-area-context': { SafeAreaView: 'View' },
    'expo-linear-gradient': { LinearGradient: 'View' },
    '../../components/common/MotionTouchable': 'Button',
    '../../components/common/FadeIn': 'View',
    '../../components/buttons/PrimaryButton': 'PrimaryButton',
    '../../components/inputs/PrimaryInput': 'PrimaryInput',
    '../../hooks/useAmbientFloat': { useAmbientFloat: () => ({ interpolate: () => 0 }) },
    '../../services/student/studentLogin': f.service('student/studentLogin'),
    '../../../assets/images/mascot.png': 1,
  })('src/screens/auth/StudentLoginScreen.tsx').default;
  const form = ui.render(screen);
  const inputs = nodes(form, item => item.type === 'PrimaryInput');
  assert.deepEqual(inputs.map(item => item.props.accessibilityLabel), ['Student Name', 'Classroom Code']);
  inputs[0].props.onChangeText('Alice');
  inputs[1].props.onChangeText('room');
  const submit = nodes(ui.render(screen), item => item.type === 'PrimaryButton')[0];
  assert.match(submit.props.title, /Start Learning/);
  await submit.props.onPress();
  assert.deepEqual(routes, ['Home']);
  assert.deepEqual(await f.getSession(), { studentId: 'alice' });
});

test('empty fields, invalid classroom codes and unknown student names fail before a session is created', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await assert.rejects(f.login('  ', 'ROOM'), /Enter your student name and classroom code/);
  await assert.rejects(f.login('Alice', '  '), /Enter your student name and classroom code/);
  await assert.rejects(f.login('Alice', 'ROOM / OTHER'), /could not verify/);
  assert.equal(f.reads.length, 0);
  await assert.rejects(f.login('Alice', 'UNKNOWN'), /could not verify/);
  await assert.rejects(f.login('Unknown Learner', 'ROOM'), /could not verify/);
  assert.equal(await f.getSession(), null);
  assert.equal(f.sessions.has('studentSession'), false);
  assert.equal(f.db.getFirstSync('SELECT COUNT(*) AS count FROM student').count, 0);
});

test('same-name students in different classrooms remain isolated, and an ambiguous roster is rejected', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  const other = profile('alice-other', { name: 'Alice', classCode: 'BLUE', teacherId: 'teacher-blue', coins: 99 });
  f.cloud.set('classes/BLUE', { code: 'BLUE', teacherId: 'teacher-blue' });
  f.cloud.set('classes/BLUE/students/alice-other', { ...other, preferredNameLower: 'alice' });
  f.cloud.set('students/alice-other', other);
  await f.login('Alice', 'ROOM');
  progress(f).reading.saveReadingAssessment('alice', 'A', 4, 4);
  await f.service('session/session').clearSession();
  await f.login('Alice', ' blue ');
  const { studentId } = await f.getSession();
  assert.equal(studentId, 'alice-other');
  assert.equal(f.student(studentId).coins, 99);
  assert.equal(progress(f).reading.isLessonCompleted(studentId, 'A'), false);
  assert.equal(progress(f).reading.isLessonCompleted('alice', 'A'), true);
  assert.equal(JSON.parse(f.sessions.get('studentSession')).studentId, studentId);

  f.cloud.set('classes/BLUE/students/duplicate', { ...other, id: 'duplicate', preferredNameLower: 'alice' });
  await assert.rejects(f.login('Alice', 'BLUE'), /could not verify/);
  assert.deepEqual(await f.getSession(), { studentId: 'alice-other' });
});

test('legacy root-only enrollment keeps its exact-name fallback within the selected classroom', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  f.cloud.set('students/legacy', profile('legacy', { name: 'Legacy Learner' }));
  f.cloud.set('students/unrelated', profile('unrelated', { name: 'Legacy Learner', classCode: 'OTHER' }));
  await assert.rejects(f.login('legacy learner'), /could not verify/);
  await f.login('  Legacy Learner  ', ' room ', false);
  assert.deepEqual(await f.getSession(), { studentId: 'legacy' });
  assert.equal(f.sessions.has('studentSession'), false);
});

test('a remembered session resumes offline after restart and reconnects only the verified student queue', async t => {
  const filename = tempDatabase();
  const sessions = new Map();
  let f = fixture({ filename, sessions });
  t.after(() => {
    f.raw.close();
    fs.rmSync(path.dirname(filename), { recursive: true, force: true });
  });
  await f.login('bob');
  await f.login('alice');
  const cloud = f.cloud;
  f.raw.close();
  f = fixture({ filename, cloud, sessions });
  f.offline(true);
  const session = f.service('session/session');
  const { refreshStudentSession, canSyncStudentSession } = f.service('student/studentLogin');
  const { processQueue } = f.service('sync/processQueue');
  assert.equal(await f.getSession(), null);
  assert.equal((await session.restoreRememberedSession()).studentId, 'alice');
  assert.deepEqual(await f.getSession(), { studentId: 'alice' });
  assert.equal(f.reads.length, 0);
  const { reading } = progress(f);
  assert.equal(reading.saveReadingAssessment('alice', 'A', 4, 4, false, quizProof('reading', 'A')).rewarded, true);
  const offlineCoins = f.student('alice').coins;
  await refreshStudentSession();
  await processQueue(canSyncStudentSession);
  assert.equal(f.writes.length, 0);
  assert.ok(f.queue().some(job => JSON.parse(job.payload).studentId === 'alice'));

  f.offline(false);
  const originalClock = Date.now;
  const now = Date.now();
  Date.now = () => now + 31_000;
  try {
    await refreshStudentSession();
    assert.equal(canSyncStudentSession('alice'), false);
    await f.login('alice');
    await processQueue(canSyncStudentSession);
  } finally { Date.now = originalClock; }
  assert.equal(cloud.get('students/alice').coins, offlineCoins);
  assert.equal(cloud.get('students/alice').readingProgress.A.completed, true);
  assert.ok(f.queue().some(job => JSON.parse(job.payload).studentId === 'bob'));
  assert.ok(!f.queue().some(job => JSON.parse(job.payload).studentId === 'alice'));

  await session.clearSession();
  assert.equal(await session.restoreRememberedSession(), null);
  f.offline(true);
  await assert.rejects(f.login('Alice', 'ROOM'), /Connect to the internet/);
  assert.equal(await f.getSession(), null);
});

test('legacy saved sessions get a bounded migration, while expired, malformed and mismatched records are cleared', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.restore('alice');
  f.sessions.set('studentSession', JSON.stringify({ studentId: 'alice', remember: true }));
  f.offline(true);
  const session = f.service('session/session');
  assert.equal((await session.restoreRememberedSession()).studentId, 'alice');
  const migrated = JSON.parse(f.sessions.get('studentSession'));
  assert.equal(migrated.version, 2);
  assert.equal(migrated.classCode, undefined);
  assert.ok(migrated.expiresAt > Date.now() && migrated.expiresAt <= Date.now() + 86_400_000);

  f.offline(false);
  await f.login('alice');
  const reverified = JSON.parse(f.sessions.get('studentSession'));
  assert.ok(reverified.expiresAt > migrated.expiresAt);
  await session.clearSession();
  for (const invalid of [
    '{broken',
    JSON.stringify({ ...migrated, expiresAt: Date.now() - 1 }),
    JSON.stringify({ ...migrated, version: 1, classCode: 'OTHER' }),
    JSON.stringify({ studentId: 'unknown', remember: true }),
    JSON.stringify({ studentId: 'alice', remember: false }),
  ]) {
    f.sessions.set('studentSession', invalid);
    assert.equal(await session.restoreRememberedSession(), null);
    assert.equal(f.sessions.has('studentSession'), false);
  }
});

test('teacher Firebase identity still expires and signs out when its credential is revoked', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  const identity = f.service('session/verifiedIdentity');
  const teacher = {
    uid: 'teacher',
    getIdTokenResult: async () => { throw Object.assign(new Error('revoked'), { code: 'auth/user-token-expired' }); },
  };
  f.auth.currentUser = teacher;
  identity.setVerifiedIdentity({ user: teacher, expiresAt: Date.parse(expiration()) });
  assert.equal(identity.getVerifiedIdentity().user, teacher);
  const now = Date.now();
  const originalClock = Date.now;
  Date.now = () => now + 6 * 60_000;
  try {
    await identity.refreshVerifiedIdentity();
    assert.equal(identity.getVerifiedIdentity(), null);
    assert.equal(f.auth.currentUser, null);
  } finally { Date.now = originalClock; }
});

test('worksheet draft retry leaves newer captures and finalized cloud results intact', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const store = f.service('phygital/worksheetStore');
  const sync = f.service('sync/syncWorksheet');
  const copy = crypto.randomUUID();
  const w = store.issueWorksheet('alice', 'reading', 'A', copy);
  const capture = { worksheetInstanceId: copy, validated: true, answers: Array(5).fill('A'),
    statuses: Array(5).fill('recognized'), confidence: Array(5).fill(1), darkness: Array.from({ length: 5 }, () => [1, 0, 0]), imageWidth: 900, imageHeight: 1200,
    quality: { paperBrightness: 210, edgeSharpness: 100 }, capturedAt: new Date(Date.now() + 60_000).toISOString() };
  store.saveWorksheetCapture('alice', copy, capture, 'file:///old.jpg');
  const ref = 'students/alice/worksheetResults/' + copy;
  f.cloud.set(ref, { worksheet: w, capture });
  await sync.syncWorksheet('alice', copy);
  assert.deepEqual(f.cloud.get(ref).capture, capture);
  const final = { studentId: 'alice', instanceId: copy, subject: 'reading', lessonId: 'A', score: 1, total: 5 };
  f.cloud.set(ref, { worksheet: w, capture, finalized: final });
  await sync.syncWorksheet('alice', copy);
  assert.deepEqual(f.cloud.get(ref), { worksheet: w, capture, finalized: final });
  await sync.restoreWorksheetHistory('alice');
  assert.deepEqual(store.getWorksheetRecord('alice', copy).finalized, final);
  assert.deepEqual(store.getWorksheetRecord('alice', copy).capture, capture);
  assert.equal(store.getWorksheetRecord('alice', copy).photoUri, null);
  await f.service('sync/processQueue').processQueue();
  assert.equal(f.queue().length, 0);
});

test('rescanning a legacy worksheet replaces its implausible local capture timestamp', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const store = f.service('phygital/worksheetStore');
  const copy = crypto.randomUUID();
  store.issueWorksheet('alice', 'reading', 'A', copy);
  const capture = { worksheetInstanceId: copy, validated: true, answers: Array(5).fill('A'),
    statuses: Array(5).fill('recognized'), confidence: Array(5).fill(1), darkness: Array.from({ length: 5 }, () => [1, 0, 0]),
    imageWidth: 900, imageHeight: 1200, quality: { paperBrightness: 210, edgeSharpness: 100 } };
  const old = { ...capture, capturedAt: new Date(Date.now() + 86_400_000).toISOString() };
  f.db.runSync('UPDATE worksheet_instances SET capture = ? WHERE studentId = ? AND instanceId = ?', [JSON.stringify(old), 'alice', copy]);
  store.saveWorksheetCapture('alice', copy, capture, 'file:///replacement.jpg');
  const saved = store.getWorksheetRecord('alice', copy);
  assert.ok(Math.abs(Date.parse(saved.capture.capturedAt) - Date.now()) < 60_000);
  assert.equal(saved.photoUri, 'file:///replacement.jpg');
  await f.service('sync/syncWorksheet').syncWorksheet('alice', copy);
  assert.equal(f.cloud.get('students/alice/worksheetResults/' + copy).capture.capturedAt, saved.capture.capturedAt);
});

test('a student queue cannot publish a new worksheet finalization on behalf of its reviewing teacher', async t => {
  const f = fixture();
  t.after(() => f.raw.close());
  await f.login('alice');
  const store = f.service('phygital/worksheetStore');
  const { processQueue } = f.service('sync/processQueue');
  const { canSyncStudentSession } = f.service('student/studentLogin');
  const id = crypto.randomUUID();
  const worksheet = store.issueWorksheet('alice', 'reading', 'A', id);
  const answers = worksheet.questions.map(question => question.correctAnswer);
  store.saveWorksheetCapture('alice', id, {
    worksheetInstanceId: id, validated: true, answers,
    statuses: Array(5).fill('recognized'), confidence: Array(5).fill(1), darkness: Array.from({ length: 5 }, () => [1, 0, 0]), imageWidth: 900, imageHeight: 1200,
    quality: { paperBrightness: 210, edgeSharpness: 100 },
  }, 'file:///captured.jpg');
  store.cacheWorksheetReviewAccess('teacher', 'alice', 'ROOM');
  store.saveWorksheetReview('alice', id, { teacherId: 'teacher', answers, reviewed: Array(5).fill(true), writing: [] });
  const result = store.finalizeWorksheet('alice', id, 'teacher');
  await processQueue(canSyncStudentSession, () => false);
  const ref = 'students/alice/worksheetResults/' + id;
  assert.equal(f.cloud.get(ref).finalized, undefined);
  assert.equal(f.cloud.get('students/alice').xp, 0);
  assert.ok(f.queue().length > 0);
  await processQueue(studentId => studentId === 'alice', (studentId, teacherId) =>
    studentId === 'alice' && teacherId === 'teacher');
  assert.deepEqual(f.cloud.get(ref).finalized, result);
  assert.equal(f.cloud.get('students/alice').readingProgress.A.completed, true);
  assert.equal(f.queue().length, 0);
});
