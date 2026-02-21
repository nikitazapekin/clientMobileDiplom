import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";

export default function AchievementsScreen() {
  const route = useRoute();
  const activeTab: TabName = route.name === "Achievements" ? "achievements" : "achievements";

  return (
    <>
      <View style={styles.containerLight}>
        <Header title="Achievements" />

        {/* Content */}
        <View style={styles.content}>
          {/* Achievements content goes here */}
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
