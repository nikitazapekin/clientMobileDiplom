import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import type { MainTabParamList, RootStackParamList } from "./types";

import { ROUTES } from "@/navigation/routes";
import AchievementsScreen from "@/screens/Achievements";
import AuthScreen from "@/screens/AuthScreen";
import ChatScreen from "@/screens/Chat";
import ChatsScreen from "@/screens/Chats";
import CodingTasksScreen from "@/screens/CodingTasks";
import CodingTaskSolveScreen from "@/screens/CodingTaskSolve";
import CourseScreen from "@/screens/Course";
import CoursesScreen from "@/screens/Courses";
import FriendsScreen from "@/screens/Friends";
import FriendsProfileScreen from "@/screens/FriendsProfile";
import LessonScreen from "@/screens/Lesson";
import MapScreen from "@/screens/Map";
import MyCoursesScreen from "@/screens/MyCourses";
import ProfileScreen from "@/screens/Profile";
import RegisterScreen from "@/screens/Register";
import SandboxScreen from "@/screens/Sandbox";
import SolutionsScreen from "@/screens/Solutions";
import WelcomeScreen from "@/screens/Welcome";

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
        <Stack.Screen name={ROUTES.STACK.MY_COURSES} component={MyCoursesScreen} />
        <Stack.Screen name={ROUTES.STACK.COURSE} component={CourseScreen} />
        <Stack.Screen name={ROUTES.STACK.MAP} component={MapScreen} />
        <Stack.Screen name={ROUTES.STACK.LESSON} component={LessonScreen} />

        <Stack.Screen name={ROUTES.STACK.ACHIEVEMENTS} component={AchievementsScreen} />

        <Stack.Screen name={ROUTES.STACK.CODING_SOLVE} component={CodingTaskSolveScreen} />

        <Stack.Screen name={ROUTES.STACK.PROFILE} component={ProfileScreen} />

        <Stack.Screen name={ROUTES.STACK.CHATS} component={ChatsScreen} />

        <Stack.Screen name={ROUTES.STACK.SANDBOX} component={CodingTasksScreen} />

        <Stack.Screen name={ROUTES.STACK.FRIENDS} component={FriendsScreen} />
        <Stack.Screen name={ROUTES.STACK.FRIENDS_PROFILE} component={FriendsProfileScreen} />
        <Stack.Screen name={ROUTES.STACK.CHAT} component={ChatScreen} />
        <Stack.Screen name={ROUTES.STACK.SOLUTIONS} component={SolutionsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
