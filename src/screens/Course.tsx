import React from "react";
import { View, Text } from "react-native";
import { useRoute } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";
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
                    <Text>Course</Text>
    <CourseInfo 
      id={id} 
      onViewMap={()=>{}}
    />
                </View>

                <Footer activeTab={activeTab} />
            </View>
        </>
    );
}
