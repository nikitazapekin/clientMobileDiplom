import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import type { RootStackParamList } from "./types";

import { ROUTES } from "@/navigation/routes";
import AuthScreen from "@/screens/AuthScreen"; 
import WelcomeScreen from "@/screens/Welcome";
import ProfileScreen from "@/screens/Profile";
const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
       
        <Stack.Screen name={ROUTES.STACK.AUTH} component={WelcomeScreen} />
   <Stack.Screen name={ROUTES.STACK.PROFILE} component={ProfileScreen} />

        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
