import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "studentSession";

export async function saveSession(session: {
  studentId: string;
  remember: boolean;
}) {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(session)
  );
}

export async function getSession() {
  const value = await AsyncStorage.getItem(KEY);

  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

export async function clearSession() {
  await AsyncStorage.removeItem(KEY);
}