import React from "react";
import { Text,View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles } from "./styles";

import CourseInfo from "@/components/CourseInfo";

type CourseScreenRouteParams = {
    id: string;

};

export default function CourseScreen() {
  const route = useRoute();
  const activeTab: TabName = route.name === "Courses" ? "courses" : "courses";
  const { id } = route.params as CourseScreenRouteParams;

  return (
    <>

      <View style={styles.containerLight}>
        <Header title="Course" />

        <View style={styles.content}>

          <CourseInfo
            id={id}

          />
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
