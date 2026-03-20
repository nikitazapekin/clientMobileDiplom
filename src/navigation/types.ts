import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

import type { ROUTES } from "./routes";

export type RootStackParamList = {
  [ROUTES.STACK.WELCOME]: undefined;
  [ROUTES.STACK.AUTH]: undefined;
  [ROUTES.STACK.REGISTER]: undefined;
  [ROUTES.STACK.MAIN]: undefined;

  [ROUTES.STACK.COURSES]: undefined;
  [ROUTES.STACK.ACHIEVEMENTS]: undefined;
  [ROUTES.STACK.CHATS]: undefined;
  [ROUTES.STACK.SANDBOX]: undefined;
  [ROUTES.STACK.PROFILE]: undefined;

  [ROUTES.STACK.COURSE]: { id: string };

  [ROUTES.STACK.MAP]: { id: string; courseName?: string };

  [ROUTES.STACK.LESSON]: { id: string };
  [ROUTES.STACK.CODING_TASKS]: undefined;
  [ROUTES.STACK.CODING_SOLVE]: { id: string };

  [ROUTES.STACK.FRIENDS]: undefined;
  [ROUTES.STACK.FRIENDS_PROFILE]: { auditoryId: string };

  [ROUTES.STACK.CHAT]: { userId: string };
};

export type MainTabParamList = {
  [ROUTES.STACK.COURSES]: undefined;
  [ROUTES.STACK.ACHIEVEMENTS]: undefined;
  [ROUTES.STACK.CHATS]: undefined;
  [ROUTES.STACK.SANDBOX]: undefined;
  [ROUTES.STACK.PROFILE]: undefined;

  [ROUTES.STACK.LESSON]: { id: string };
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type FormNavigationProp = StackNavigationProp<RootStackParamList>;
