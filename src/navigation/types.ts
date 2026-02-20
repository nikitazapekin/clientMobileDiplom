import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

import type { ROUTES } from "./routes";
 
export type RootStackParamList = {
  Home: undefined;
  [ROUTES.STACK.MAIN]: undefined;
  [ROUTES.STACK.AUTH]: undefined;
  [ROUTES.STACK.PROFILE]: undefined;
 [ROUTES.STACK.REGISTER]: undefined;
 
};
export type FormNavigationProp = StackNavigationProp<RootStackParamList>;

 