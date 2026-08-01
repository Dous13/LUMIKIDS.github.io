import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("lumikids.db");

export function initializeDatabase() {

  db.execSync(`
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

      synced INTEGER DEFAULT 0,

      PRIMARY KEY(studentId, lessonId)
    );

    CREATE TABLE IF NOT EXISTS owned_mascots (
      studentId TEXT NOT NULL,
      mascotId TEXT NOT NULL,

      PRIMARY KEY(studentId, mascotId)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      action TEXT NOT NULL,

      payload TEXT NOT NULL,

      createdAt INTEGER,

      synced INTEGER DEFAULT 0
    );
  `);
}