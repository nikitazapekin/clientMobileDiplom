import React from "react";
import { View, Text } from "react-native";
import { useRoute } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";


import UserProfile from "../components/UserProfile"
export default function ProfileScreen() {
  const route = useRoute();
  const activeTab: TabName = route.name === "Profile" ? "profile" : "profile";

  return (
    <>
      <View style={styles.containerLight}>
        <Header title="Profile" />

      
        <View style={styles.content}>
      <UserProfile /> 
 
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
