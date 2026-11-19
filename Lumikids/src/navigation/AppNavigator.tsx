import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { AppState } from "react-native";
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
import React, { useCallback, useEffect } from "react";
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
import PhygitalScanScreen from "../screens/phygital/PhygitalScanScreen";
import WorksheetCaptureScreen from "../screens/phygital/WorksheetCaptureScreen";
import WorksheetPreviewScreen from "../screens/phygital/WorksheetPreviewScreen";
import WorksheetReviewScreen from "../screens/phygital/WorksheetReviewScreen";
import LessonActivityChoiceScreen from "../screens/student/LessonActivityChoiceScreen";
import RemedialQuizScreen from "../screens/student/RemedialQuizScreen";
import { auth, clearLegacyTeacherAuthStorage } from "../services/firebase/firebase";
import { getVerifiedIdentity, refreshVerifiedIdentity } from "../services/session/verifiedIdentity";
import { getActiveStudentSession } from "../services/session/session";
import { canSyncStudentSession, refreshStudentSession } from "../services/student/studentLogin";
import { hasWorksheetReviewAccess } from "../services/phygital/worksheetStore";

const Stack = createNativeStackNavigator<RootStackParamList>();
const publicRoutes = new Set(["Splash", "Welcome", "StudentLogin", "TeacherLogin"]);
const teacherRoutes = new Set(["TeacherHome", "TeacherClass", "TeacherStudent"]);

export default function AppNavigator() {
  const navigation = useNavigationContainerRef<RootStackParamList>();
  const requireSession = useCallback(() => {
    const route = navigation.getCurrentRoute();
    if (!route || publicRoutes.has(route.name)) return;
    const student = getActiveStudentSession();
    const teacher = getVerifiedIdentity();
    const allowed = teacherRoutes.has(route.name) ? teacher
      : route.name === "WorksheetReview" ? student || teacher
      : student;
    if (!allowed) navigation.resetRoot({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  useEffect(() => {
    try {
      console.log("Initializing database...");
      initializeDatabase();
      console.log("Database initialized!");

      void clearLegacyTeacherAuthStorage().catch(error => console.warn("Could not clear legacy teacher storage.", error));
      const tick = () => {
        requireSession();
        if (AppState.currentState === "background") return;
        void refreshVerifiedIdentity().then(requireSession).catch(requireSession);
        void refreshStudentSession().then(requireSession).catch(requireSession);
        if (getActiveStudentSession() || getVerifiedIdentity()) {
          void processQueue(studentId => {
            if (getActiveStudentSession()) return canSyncStudentSession(studentId);
            const teacher = getVerifiedIdentity();
            return !!teacher && hasWorksheetReviewAccess(teacher.user.uid, studentId);
          }, (studentId, reviewerId) => {
            return getVerifiedIdentity()?.user.uid === reviewerId && hasWorksheetReviewAccess(reviewerId, studentId);
          }).catch(error => console.warn("Could not check pending sync work.", error));
        }
      };
      const interval = setInterval(tick, 5000);
      const subscription = AppState.addEventListener("change", state => { if (state === "active") tick(); });
      const unsubscribe = auth.onAuthStateChanged(requireSession);
      return () => {
        clearInterval(interval);
        subscription.remove();
        unsubscribe();
      };

    } catch (e) {
      console.error("Database failed:", e);
    }
  }, [requireSession]);

  return (
    <NavigationContainer ref={navigation} onStateChange={requireSession}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="WorksheetReview" component={WorksheetReviewScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen
          name="PhygitalScan"
          component={PhygitalScanScreen}
        />
        <Stack.Screen
          name="WorksheetCapture"
          component={WorksheetCaptureScreen}
        />
        <Stack.Screen
          name="WorksheetPreview"
          component={WorksheetPreviewScreen}
        />
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
          options={{
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
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
        <Stack.Screen
          name="LessonActivityChoice"
          component={LessonActivityChoiceScreen}
        />
        <Stack.Screen
          name="RemedialQuiz"
          component={RemedialQuizScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
