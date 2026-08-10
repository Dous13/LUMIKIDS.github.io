export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  RoleSelection: undefined;
  StudentLogin: undefined;
  TeacherLogin: undefined;
  Home: undefined;
  TeacherHome: undefined;
  TeacherClass: { classCode: string };
  TeacherStudent: { studentId: string; classCode: string };
  Dashboard: undefined;
  Reading: undefined;
  Shop: undefined;
  Writing: undefined;
  Math: undefined;
  MathQuiz: {
    lessonId: number;
  };
  MathLesson: {
    lessonId: number;
  };
  MathResult: {
    lessonId: number;
    score: number;
    total: number;
    xp: number;
    coins: number;
    stars: number;
    unlocked: boolean;
  };

  TraceLetter: {
    lessonId: string;
  };

  WritingLesson: {
    lessonId: string;
  };

  Lesson: {
    lessonId: string;
  };

  Quiz: {
    lessonId: string;
  };

  Reward: {
    subject: "reading" | "writing" | "math";
    lessonId: string | number;
    xp: number;
    coins: number;
    stars: number;
    unlocked: boolean;
    levelUp: boolean;
  };
};