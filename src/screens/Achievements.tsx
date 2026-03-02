import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles } from "./styles";

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
