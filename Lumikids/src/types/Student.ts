
export interface Student {
  studentId: string;
  id: string;
  name: string;
  classCode: string;

  xp: number;
  coins: number;
  stars: number;

  level: number;
  streak: number;

  readingProgress: number;
  readingXP: number;
  writingProgress: number;
  writingXP: number;
  mathProgress: number;
  mathXP: number;

  avatar: string;

  createdAt?: Date;
}
