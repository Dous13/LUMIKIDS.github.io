export interface Student {
  id: string;
  name: string;
  classCode: string;

  xp: number;
  level: number;
  streak: number;

  readingXP: number;
  writingXP: number;
  mathXP: number;

  avatar: string;

  createdAt: Date;
}