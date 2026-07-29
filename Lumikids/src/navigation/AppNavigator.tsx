import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import { RootStackParamList } from "../types/navigation";

import SplashScreen from "../screens/splash/SplashScreen";
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import StudentLoginScreen from "../screens/auth/StudentLoginScreen";
import TeacherLoginScreen from "../screens/auth/TeacherLoginScreen";
import HomeScreen from "../screens/student/HomeScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
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
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}