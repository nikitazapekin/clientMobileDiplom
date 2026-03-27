import React from "react";
import { View } from "react-native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles } from "./styles";

import CoursesList from "@/components/Courses";

export default function MyCoursesScreen() {
  const activeTab: TabName = "courses";

  return (
    <View style={styles.containerLight}>
      <Header title="My Courses" />

      <View style={styles.content}>
        <CoursesList mode="subscribed" />
      </View>

      <Footer activeTab={activeTab} />
    </View>
  );
}
