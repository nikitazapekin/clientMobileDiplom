import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import type { ROUTES } from "./routes";

export type RootStackParamList = {
  [ROUTES.STACK.WELCOME]: undefined;
  [ROUTES.STACK.AUTH]: undefined;
  [ROUTES.STACK.REGISTER]: undefined;
  [ROUTES.STACK.MAIN]: undefined;

    [ROUTES.SCREENS.COURSES]: undefined;
  [ROUTES.SCREENS.ACHIEVEMENTS]: undefined;
  [ROUTES.SCREENS.CHATS]: undefined;
  [ROUTES.SCREENS.SANDBOX]: undefined;
  [ROUTES.SCREENS.PROFILE]: undefined;
};

export type MainTabParamList = {
  [ROUTES.SCREENS.COURSES]: undefined;
  [ROUTES.SCREENS.ACHIEVEMENTS]: undefined;
  [ROUTES.SCREENS.CHATS]: undefined;
  [ROUTES.SCREENS.SANDBOX]: undefined;
  [ROUTES.SCREENS.PROFILE]: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

export type FormNavigationProp = StackNavigationProp<RootStackParamList>;

 