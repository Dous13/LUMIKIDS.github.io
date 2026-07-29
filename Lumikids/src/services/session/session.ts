import AsyncStorage from "@react-native-async-storage/async-storage";
import { StudentSession } from "../../types/session";

const SESSION_KEY = "studentSession";

export async function saveSession(session: StudentSession) {
  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );
}

export async function getSession(): Promise<StudentSession | null> {
  const data = await AsyncStorage.getItem(SESSION_KEY);

  if (!data) return null;

  return JSON.parse(data);
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}