import { useCallback, useState } from "react";
import { Student } from "../models/Student";
import { getLocalStudent } from "../services/database/localStudent";

export function useStudent(studentId: string) {
  const [student, setStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] =
    useState(true);

  const reload = useCallback(() => {
    if (!studentId) return;

    const data = getLocalStudent(studentId);

    console.log("Loaded Student:", data);

    setStudent(data);
    setLoading(false);
  }, [studentId]);

  return {
    student,
    loading,
    reload,
  };
}