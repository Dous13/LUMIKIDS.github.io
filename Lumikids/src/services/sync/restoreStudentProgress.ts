import { doc, getDoc } from "firebase/firestore";
import { db as firestore } from "../firebase/firebase";
import { db as localDb } from "../database/database";

type CloudProgress = {
  unlocked?: boolean | number;
  completed?: boolean | number;
  stars?: number;
  quizScore?: number;
  quizTotal?: number;
  xpEarned?: number;
};

type ProgressTable =
  | "lesson_progress"
  | "writing_progress"
  | "math_progress";

function toFlag(value: unknown): number {
  return value === true || value === 1 ? 1 : 0;
}

function toNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function mergeProgress(
  studentId: string,
  table: ProgressTable,
  cloudProgress: Record<string, CloudProgress> | undefined
) {
  if (!cloudProgress || typeof cloudProgress !== "object") {
    return;
  }

  for (const [lessonId, cloud] of Object.entries(cloudProgress)) {
    if (!cloud || typeof cloud !== "object") {
      continue;
    }

    const local = localDb.getFirstSync(
      `SELECT * FROM ${table} WHERE studentId = ? AND lessonId = ?`,
      [studentId, String(lessonId)]
    ) as any;

    const cloudUnlocked = toFlag(cloud.unlocked);
    const cloudCompleted = toFlag(cloud.completed);

    const unlocked = Math.max(
      toFlag(local?.unlocked),
      cloudUnlocked
    );

    const completed = Math.max(
      toFlag(local?.completed),
      cloudCompleted
    );

    const stars = Math.max(
      toNumber(local?.stars),
      toNumber(cloud.stars)
    );

    const localAhead =
      toFlag(local?.unlocked) > cloudUnlocked ||
      toFlag(local?.completed) > cloudCompleted ||
      toNumber(local?.stars) > toNumber(cloud.stars);

    const needsUpload =
      Number(local?.synced ?? 1) === 0 || localAhead;

    const synced = needsUpload ? 0 : 1;

    if (table === "lesson_progress") {
      localDb.runSync(
        `
        INSERT OR REPLACE INTO lesson_progress (
          studentId,
          lessonId,
          unlocked,
          completed,
          stars,
          quizScore,
          quizTotal,
          synced
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          studentId,
          String(lessonId),
          unlocked,
          completed,
          stars,
          Math.max(
            toNumber(local?.quizScore),
            toNumber(cloud.quizScore)
          ),
          Math.max(
            toNumber(local?.quizTotal),
            toNumber(cloud.quizTotal)
          ),
          synced,
        ]
      );
    }

    if (table === "writing_progress") {
      localDb.runSync(
        `
        INSERT OR REPLACE INTO writing_progress (
          studentId,
          lessonId,
          unlocked,
          completed,
          stars,
          synced
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          studentId,
          String(lessonId),
          unlocked,
          completed,
          stars,
          synced,
        ]
      );
    }

    if (table === "math_progress") {
      localDb.runSync(
        `
        INSERT OR REPLACE INTO math_progress (
          studentId,
          lessonId,
          unlocked,
          completed,
          stars,
          quizScore,
          quizTotal,
          xpEarned,
          synced
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          studentId,
          String(lessonId),
          unlocked,
          completed,
          stars,
          Math.max(
            toNumber(local?.quizScore),
            toNumber(cloud.quizScore)
          ),
          Math.max(
            toNumber(local?.quizTotal),
            toNumber(cloud.quizTotal)
          ),
          Math.max(
            toNumber(local?.xpEarned),
            toNumber(cloud.xpEarned)
          ),
          synced,
        ]
      );
    }
  }
}

export async function restoreStudentProgress(
  studentId: string
): Promise<void> {
  const snapshot = await getDoc(
    doc(firestore, "students", studentId)
  );

  if (!snapshot.exists()) {
    return;
  }

  const data = snapshot.data();

  localDb.withTransactionSync(() => {
    mergeProgress(
      studentId,
      "lesson_progress",
      data.readingProgress
    );

    mergeProgress(
      studentId,
      "writing_progress",
      data.writingProgress
    );

    mergeProgress(
      studentId,
      "math_progress",
      data.mathProgress
    );
  });

  console.log(
    `[ProgressRestore] Restored and merged cloud progress for ${studentId}`
  );
}