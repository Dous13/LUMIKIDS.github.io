import { useEffect, useState } from "react";

import { Student } from "../models/Student";

import { getStudent } from "../services/student/studentServices";

export function useStudent(studentId: string) {

    const [student, setStudent] =
        useState<Student | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        if (!studentId) return;

        async function loadStudent() {
            const data = await getStudent(studentId);

            console.log("Loaded Student:", data);

            setStudent(data);
            setLoading(false);
        }

        loadStudent();
        }, [studentId]);

        return {
            student,
            loading,
    };

}