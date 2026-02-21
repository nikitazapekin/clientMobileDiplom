import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";

export default function ProfileScreen() {
  const route = useRoute();
  const activeTab: TabName = route.name === "Profile" ? "profile" : "profile";

  return (
    <>
      <View style={styles.containerLight}>
        <Header title="Profile" />

        {/* Content */}
        <View style={styles.content}>
          {/* Profile content goes here */}
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
