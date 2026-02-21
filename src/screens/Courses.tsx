import React, { useState } from "react";
import { View } from "react-native";

import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";

export default function CoursesScreen() {
  const [activeTab, setActiveTab] = useState<TabName>("courses");

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    // Navigation logic would go here
  };

  return (
    <>
      <View style={styles.containerLight}>
        <Header title="Courses" />

        {/* Content */}
        <View style={styles.content}>
          {/* Courses content goes here */}
        </View>

        <Footer activeTab={activeTab} onTabPress={handleTabPress} />
      </View>
    </>
  );
}
