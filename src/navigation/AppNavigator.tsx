import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import type { RootStackParamList, MainTabParamList } from "./types";

import { ROUTES } from "@/navigation/routes";
import AuthScreen from "@/screens/AuthScreen";
import WelcomeScreen from "@/screens/Welcome";
import ProfileScreen from "@/screens/Profile";
import RegisterScreen from "@/screens/Register";
import CoursesScreen from "@/screens/Courses";
import AchievementsScreen from "@/screens/Achievements";
import ChatsScreen from "@/screens/Chats";
import SandboxScreen from "@/screens/Sandbox";
import CourseScreen from "@/screens/Course";
import MapScreen from "@/screens/Map";
import LessonScreen from "@/screens/Lesson";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tab.Screen name={ROUTES.SCREENS.COURSES} component={CoursesScreen} />
      <Tab.Screen name={ROUTES.SCREENS.ACHIEVEMENTS} component={AchievementsScreen} />
      <Tab.Screen name={ROUTES.SCREENS.CHATS} component={ChatsScreen} />
      <Tab.Screen name={ROUTES.SCREENS.SANDBOX} component={SandboxScreen} />
      <Tab.Screen name={ROUTES.SCREENS.PROFILE} component={ProfileScreen} />
 

  
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={ROUTES.STACK.WELCOME}
      >
        <Stack.Screen name={ROUTES.STACK.WELCOME} component={WelcomeScreen} />
        <Stack.Screen name={ROUTES.STACK.AUTH} component={AuthScreen} />
        <Stack.Screen name={ROUTES.STACK.REGISTER} component={RegisterScreen} />
        <Stack.Screen name={ROUTES.STACK.MAIN} component={MainTabs} />
        <Stack.Screen name={ROUTES.STACK.COURSES} component={CoursesScreen} />
        <Stack.Screen name={ROUTES.STACK.COURSE} component={CourseScreen} />
        <Stack.Screen name={ROUTES.STACK.MAP} component={MapScreen} />
        <Stack.Screen name={ROUTES.STACK.LESSON} component={LessonScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
