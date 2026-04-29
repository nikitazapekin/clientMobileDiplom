import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import type { MainTabParamList, RootStackParamList } from "./types";

import { ROUTES } from "@/navigation/routes";

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const getAchievementsScreen = () => require("../screens/Achievements").default;
const getArticleScreen = () => require("../screens/Article").default;
const getArticleEditorScreen = () => require("../screens/ArticleEditor").default;
const getArticlesScreen = () => require("../screens/Articles").default;
const getAuthScreen = () => require("../screens/AuthScreen").default;
const getChatScreen = () => require("../screens/Chat").default;
const getChatsScreen = () => require("../screens/Chats").default;
const getCheckpointScreen = () => require("../screens/Checkpoint").default;
const getCodingTasksScreen = () => require("../screens/CodingTasks").default;
const getCodingTaskSolveScreen = () => require("../screens/CodingTaskSolve").default;
const getCourseScreen = () => require("../screens/Course").default;
const getCoursesScreen = () => require("../screens/Courses").default;
const getForumScreen = () => require("../screens/Forum").default;
const getForumEditorScreen = () => require("../screens/ForumEditor").default;
const getForumQuestionScreen = () => require("../screens/ForumQuestion").default;
const getFriendsScreen = () => require("../screens/Friends").default;
const getFriendsProfileScreen = () => require("../screens/FriendsProfile").default;
const getLessonScreen = () => require("../screens/Lesson").default;
const getMapScreen = () => require("../screens/Map").default;
const getMyCoursesScreen = () => require("../screens/MyCourses").default;
const getProfileScreen = () => require("../screens/Profile").default;
const getRegisterScreen = () => require("../screens/Register").default;
const getSandboxScreen = () => require("../screens/Sandbox").default;
const getSolutionsScreen = () => require("../screens/Solutions").default;
const getWelcomeScreen = () => require("../screens/Welcome").default;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tab.Screen name={ROUTES.SCREENS.COURSES} getComponent={getCoursesScreen} />
      <Tab.Screen name={ROUTES.SCREENS.ACHIEVEMENTS} getComponent={getAchievementsScreen} />
      <Tab.Screen name={ROUTES.SCREENS.CHATS} getComponent={getChatsScreen} />
      <Tab.Screen name={ROUTES.SCREENS.SANDBOX} getComponent={getSandboxScreen} />
      <Tab.Screen name={ROUTES.SCREENS.PROFILE} getComponent={getProfileScreen} />
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
        <Stack.Screen name={ROUTES.STACK.WELCOME} getComponent={getWelcomeScreen} />
        <Stack.Screen name={ROUTES.STACK.AUTH} getComponent={getAuthScreen} />
        <Stack.Screen name={ROUTES.STACK.REGISTER} getComponent={getRegisterScreen} />
        <Stack.Screen name={ROUTES.STACK.MAIN} component={MainTabs} />
        <Stack.Screen name={ROUTES.STACK.COURSES} getComponent={getCoursesScreen} />
        <Stack.Screen name={ROUTES.STACK.MY_COURSES} getComponent={getMyCoursesScreen} />
        <Stack.Screen name={ROUTES.STACK.COURSE} getComponent={getCourseScreen} />
        <Stack.Screen name={ROUTES.STACK.MAP} getComponent={getMapScreen} />
        <Stack.Screen name={ROUTES.STACK.LESSON} getComponent={getLessonScreen} />
        <Stack.Screen name={ROUTES.STACK.CHECKPOINT} getComponent={getCheckpointScreen} />

        <Stack.Screen name={ROUTES.STACK.ACHIEVEMENTS} getComponent={getAchievementsScreen} />

        <Stack.Screen name={ROUTES.STACK.CODING_SOLVE} getComponent={getCodingTaskSolveScreen} />

        <Stack.Screen name={ROUTES.STACK.PROFILE} getComponent={getProfileScreen} />

        <Stack.Screen name={ROUTES.STACK.CHATS} getComponent={getChatsScreen} />

        <Stack.Screen name={ROUTES.STACK.SANDBOX} getComponent={getCodingTasksScreen} />

        <Stack.Screen name={ROUTES.STACK.FRIENDS} getComponent={getFriendsScreen} />
        <Stack.Screen name={ROUTES.STACK.FRIENDS_PROFILE} getComponent={getFriendsProfileScreen} />
        <Stack.Screen name={ROUTES.STACK.CHAT} getComponent={getChatScreen} />
        <Stack.Screen name={ROUTES.STACK.SOLUTIONS} getComponent={getSolutionsScreen} />
        <Stack.Screen name={ROUTES.STACK.FORUM} getComponent={getForumScreen} />
        <Stack.Screen name={ROUTES.STACK.FORUM_QUESTION} getComponent={getForumQuestionScreen} />
        <Stack.Screen name={ROUTES.STACK.FORUM_EDITOR} getComponent={getForumEditorScreen} />
        <Stack.Screen name={ROUTES.STACK.ARTICLES} getComponent={getArticlesScreen} />
        <Stack.Screen name={ROUTES.STACK.ARTICLE} getComponent={getArticleScreen} />
        <Stack.Screen name={ROUTES.STACK.ARTICLE_EDITOR} getComponent={getArticleEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
