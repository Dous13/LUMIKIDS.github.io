export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  RoleSelection: undefined;
  StudentLogin: undefined;
  TeacherLogin: undefined;
  Home: undefined;

  Reading: undefined;
  Shop: undefined;
  Writing: undefined;
  Math: undefined;
<<<<<<< HEAD

  MathLesson: {
    lessonId: number;
  };

  MathQuiz: {
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
=======
  MathQuiz: {
  lessonId: number;
};
  MathLesson: {
  lessonId: number;
};
>>>>>>> f72fcc3e12dc016ecac867e87b81a0e66690fcd2

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
    lessonId: number;
    xp: number;
    coins: number;
    stars: number;
    unlocked: boolean;
    levelUp: boolean;
  };
};