import { Student } from "../../types/Student";

import { generateStudentId } from "../auth/auth";

export function createStudentProfile(

  name: string,

  classCode: string

): Student {

  return {

    studentId: generateStudentId(),

    name,

    classCode,

    level: 1,

    xp: 0,

    stars: 0,

    readingProgress: 0,

    writingProgress: 0,

    mathProgress: 0,

    avatar: "bear",

    createdAt: new Date().toISOString(),

  };

}