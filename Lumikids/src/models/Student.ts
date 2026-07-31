export interface Student {
  id: string;

  name: string;
  classCode: string;

  xp: number;
  readingXP: number;
  writingXP: number;
  mathXP: number;

  level: number;
  streak: number;

  avatar: string;

  readingProgress?: Record<
    string,
    {
      unlocked: boolean;
      completed: boolean;
      stars: number;
    }
  >;
}