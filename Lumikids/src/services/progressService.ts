import { readingLessons } from "../data/readingLessons";

export type LessonProgress = {
  unlocked: boolean;
  completed: boolean;
  stars: number;
};

const lessonProgress: Record<string, LessonProgress> = {};

// Automatically create progress for every lesson
readingLessons.forEach((lesson, index) => {
  lessonProgress[lesson.id] = {
    unlocked: index === 0, // Only the first lesson starts unlocked
    completed: false,
    stars: 0,
  };
});

export function getLessonProgress(id: string) {
  return lessonProgress[id];
}

export function completeLesson(
  id: string,
  stars: number
) {
  if (!lessonProgress[id]) return;

  lessonProgress[id].completed = true;
  lessonProgress[id].stars = stars;
}

export function unlockNextLesson(currentLessonId: string) {
  const currentIndex = readingLessons.findIndex(
    lesson => lesson.id === currentLessonId
  );

  if (
    currentIndex >= 0 &&
    currentIndex < readingLessons.length - 1
  ) {
    const nextLesson =
      readingLessons[currentIndex + 1];

    lessonProgress[nextLesson.id].unlocked = true;
  }
}

export function getAllProgress() {
  return lessonProgress;
}