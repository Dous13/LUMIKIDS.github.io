import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import SplashScreen from "../screens/splash/SplashScreen";
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import StudentLoginScreen from "../screens/auth/StudentLoginScreen";
import TeacherLoginScreen from "../screens/auth/TeacherLoginScreen";
import HomeScreen from "../screens/student/HomeScreen";
import ReadingScreen from "../screens/reading/ReadingScreen";
import LessonScreen from "../screens/reading/LessonScreen";
import QuizScreen from "../screens/reading/QuizScreen";
import React, { useEffect } from "react";
import { initializeDatabase } from "../services/database/database";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {

useEffect(() => {
  try {
    console.log("Initializing database...");
    initializeDatabase();
    console.log("Database initialized!");
  } catch (e) {
    console.error("Database failed:", e);
  }
}, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen
          name="StudentLogin"
          component={StudentLoginScreen}
        />
        <Stack.Screen
          name="TeacherLogin"
          component={TeacherLoginScreen}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen
          name="Reading"
          component={ReadingScreen}
        />
        <Stack.Screen
          name="Lesson"
          component={LessonScreen}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}