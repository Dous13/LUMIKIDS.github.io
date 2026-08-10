import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import SplashScreen from "../screens/splash/SplashScreen";
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import StudentLoginScreen from "../screens/auth/StudentLoginScreen";
import TeacherLoginScreen from "../screens/auth/TeacherLoginScreen";
import HomeScreen from "../screens/student/HomeScreen";
import DashboardScreen from "../screens/student/DashboardScreen";
import ReadingScreen from "../screens/reading/ReadingScreen";
import LessonScreen from "../screens/reading/LessonScreen";
import QuizScreen from "../screens/reading/QuizScreen";
import React, { useEffect } from "react";
import { initializeDatabase } from "../services/database/database";
import RewardScreen from "../screens/student/RewardScreen";
import ShopScreen from "../screens/shop/ShopScreen";
import { processQueue } from "../services/sync/processQueue";
import WritingLessonScreen from "../screens/writing/WritingLessonScreen";
import WritingScreen from "../screens/writing/writingScreen";
import TraceLetterScreen from "../screens/writing/TraceLetterScreen";
import MathScreen from "../screens/math/MathScreen";
import MathLessonScreen from "../screens/math/MathLessonScreen";
import MathQuizScreen from "../screens/math/MathQuizScreen";
import MathResultScreen from "../screens/math/MathResultScreen";
import TeacherHomeScreen from "../screens/teacher/TeacherHomeScreen";
import TeacherClassScreen from "../screens/teacher/TeacherClassScreen";
import TeacherStudentScreen from "../screens/teacher/TeacherStudentScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {

  useEffect(() => {
    try {
      console.log("Initializing database...");
      initializeDatabase();
      console.log("Database initialized!");

      processQueue();

      const interval = setInterval(() => {
        processQueue();
      }, 5000);

      return () => clearInterval(interval);

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
        <Stack.Screen name="TeacherHome" component={TeacherHomeScreen} />
        <Stack.Screen name="TeacherClass" component={TeacherClassScreen} />
        <Stack.Screen name="TeacherStudent" component={TeacherStudentScreen} />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
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
        <Stack.Screen
          name="Reward"
          component={RewardScreen}
        />
        <Stack.Screen
            name="WritingLesson"
            component={WritingLessonScreen}
        />
        <Stack.Screen
          name="Writing"
          component={WritingScreen}
        />
        <Stack.Screen
            name="TraceLetter"
            component={TraceLetterScreen}
        />
        <Stack.Screen
          name="Math"
          component={MathScreen}
        />
        <Stack.Screen
          name="MathLesson"
          component={MathLessonScreen}
        />
        <Stack.Screen
          name="MathQuiz"
          component={MathQuizScreen}
        />
        <Stack.Screen
          name="MathResult"
          component={MathResultScreen}
        />
        <Stack.Screen
            name="Shop"
            component={ShopScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}