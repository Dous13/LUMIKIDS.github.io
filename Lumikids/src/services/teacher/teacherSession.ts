import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "teacherSession";

export type TeacherSession = {
  teacherId: string;
  email: string;
  name: string;
};

export async function saveTeacherSession(session: TeacherSession) {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function getTeacherSession(): Promise<TeacherSession | null> {
  const value = await AsyncStorage.getItem(KEY);
  return value ? JSON.parse(value) : null;
}

export async function clearTeacherSession() {
  await AsyncStorage.removeItem(KEY);
}
