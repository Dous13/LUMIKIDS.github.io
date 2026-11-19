import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("lumikids.db");

export function initializeDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS worksheet_instances (
      studentId TEXT NOT NULL,
      instanceId TEXT NOT NULL,
      worksheet TEXT NOT NULL,
      capture TEXT,
      photoUri TEXT,
      review TEXT,
      finalized TEXT,
      PRIMARY KEY(studentId, instanceId)
    );
    CREATE TABLE IF NOT EXISTS worksheet_review_access (
      teacherId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      classCode TEXT NOT NULL,
      PRIMARY KEY(teacherId, studentId)
    );
    CREATE TABLE IF NOT EXISTS student (
      id TEXT PRIMARY KEY,
      name TEXT,
      classCode TEXT,

      xp INTEGER DEFAULT 0,
      readingXP INTEGER DEFAULT 0,
      writingXP INTEGER DEFAULT 0,
      mathXP INTEGER DEFAULT 0,

      coins INTEGER DEFAULT 0,

      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,

      avatar TEXT DEFAULT 'default'
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      studentId TEXT NOT NULL,
      lessonId TEXT NOT NULL,

      unlocked INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      stars INTEGER DEFAULT 0,
      quizScore INTEGER DEFAULT 0,
      quizTotal INTEGER DEFAULT 0,

      synced INTEGER DEFAULT 0,

      PRIMARY KEY(studentId, lessonId)
    );

    CREATE TABLE IF NOT EXISTS writing_progress (
      studentId TEXT NOT NULL,
      lessonId TEXT NOT NULL,

      unlocked INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      stars INTEGER DEFAULT 0,

      synced INTEGER DEFAULT 0,

      PRIMARY KEY(studentId, lessonId)
    );

    CREATE TABLE IF NOT EXISTS math_progress (
      studentId TEXT NOT NULL,
      lessonId TEXT NOT NULL,

      unlocked INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      stars INTEGER DEFAULT 0,

      quizScore INTEGER DEFAULT 0,
      quizTotal INTEGER DEFAULT 0,

      xpEarned INTEGER DEFAULT 0,

      synced INTEGER DEFAULT 0,

      PRIMARY KEY(studentId, lessonId)
    );

    CREATE TABLE IF NOT EXISTS owned_mascots (
      studentId TEXT NOT NULL,
      mascotId TEXT NOT NULL,

      PRIMARY KEY(studentId, mascotId)
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      studentId TEXT NOT NULL,
      subject TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      questionKey TEXT NOT NULL,
      question TEXT NOT NULL,
      selectedAnswer TEXT NOT NULL,
      correctAnswer TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      synced INTEGER DEFAULT 0,
      PRIMARY KEY(studentId, subject, lessonId, questionKey)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      action TEXT NOT NULL,

      payload TEXT NOT NULL,

      createdAt INTEGER,

      synced INTEGER DEFAULT 0,

      retryCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS student_profile_sync (
      studentId TEXT PRIMARY KEY NOT NULL,
      deviceId TEXT NOT NULL DEFAULT (lower(hex(randomblob(16)))),
      legacyProfile TEXT,
      confirmedProfile TEXT
    );

    CREATE TABLE IF NOT EXISTS student_profile_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      subject TEXT,
      lessonId TEXT,
      xp INTEGER NOT NULL DEFAULT 0,
      coins INTEGER NOT NULL DEFAULT 0,
      avatar TEXT,
      mascotId TEXT,
      operation TEXT,
      syncRejection TEXT
    );
    CREATE INDEX IF NOT EXISTS student_profile_changes_student ON student_profile_changes (studentId, id);
  `);

  const columns = db.getAllSync(`PRAGMA table_info(lesson_progress)`) as Array<{ name: string }>;
  if (!columns.some(column => column.name === "quizScore")) {
    db.execSync(`ALTER TABLE lesson_progress ADD COLUMN quizScore INTEGER DEFAULT 0`);
  }
  // Add skillId to existing mistakes tables without deleting saved records.
  const mistakeColumns = db.getAllSync(
    `PRAGMA table_info(mistakes)`
  ) as Array<{ name: string }>;

  if (!mistakeColumns.some(column => column.name === "skillId")) {
    db.execSync(
      `ALTER TABLE mistakes ADD COLUMN skillId TEXT DEFAULT 'general'`
    );
  }
  if (!columns.some(column => column.name === "quizTotal")) {
    db.execSync(`ALTER TABLE lesson_progress ADD COLUMN quizTotal INTEGER DEFAULT 0`);
  }
  const changeColumns = db.getAllSync<{ name: string }>("PRAGMA table_info(student_profile_changes)");
  if (!changeColumns.some(column => column.name === "operation")) {
    db.execSync("ALTER TABLE student_profile_changes ADD COLUMN operation TEXT");
  }
  if (!changeColumns.some(column => column.name === "syncRejection")) {
    db.execSync("ALTER TABLE student_profile_changes ADD COLUMN syncRejection TEXT");
  }

  const queueColumns = db.getAllSync<{ name: string }>("PRAGMA table_info(sync_queue)");
  if (!queueColumns.some(column => column.name === "revision")) {
    db.withTransactionSync(() => {
      // Old jobs had no mutation details. Keep their existing local balance
      // and avatar as a baseline until the first confirmed upload.
      db.execSync(`
        INSERT OR IGNORE INTO student_profile_sync (studentId, legacyProfile)
        SELECT s.id, json_object('xp', s.xp, 'coins', s.coins, 'avatar', s.avatar,
          'readingXP', s.readingXP, 'writingXP', s.writingXP, 'mathXP', s.mathXP)
        FROM student s WHERE EXISTS (
          SELECT 1 FROM sync_queue q WHERE q.synced = 0
          AND q.action = 'SYNC_STUDENT'
          AND json_extract(CASE WHEN json_valid(q.payload) THEN q.payload ELSE '{}' END, '$.studentId') = s.id
        );
        ALTER TABLE sync_queue ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
      `);
    });
  }
  if (!queueColumns.some(column => column.name === "blocked")) {
    db.execSync("ALTER TABLE sync_queue ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0");
  }
}

    // Existing installations may have been created before quiz score fields
    // were introduced. Add the fields without destroying local progress.
