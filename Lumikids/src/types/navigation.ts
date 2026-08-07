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
  MathQuiz: {
  lessonId: number;
};
  MathLesson: {
  lessonId: number;
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
    lessonId: number;
    xp: number;
    coins: number;
    stars: number;
    unlocked: boolean;
    levelUp: boolean;
  };
};