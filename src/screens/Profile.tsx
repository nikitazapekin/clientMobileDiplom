import React from "react";
import { Text,View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";
import UserProfile from "../components/UserProfile";

import { styles } from "./styles";

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
