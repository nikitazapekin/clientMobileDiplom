import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";
import CoursesList from "@/components/Courses";

export default function CoursesScreen() {
    const route = useRoute();
    const activeTab: TabName = route.name === "Courses" ? "courses" : "courses";

    return (
        <>
            <View style={styles.containerLight}>
                <Header title="Courses" />

             
                <View style={styles.content}>

                    <CoursesList />
                </View>

                <Footer activeTab={activeTab} />
            </View>
        </>
    );
}
