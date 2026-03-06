import {  View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles } from "./styles";
 
import Map from "@/components/Map";

type CourseScreenRouteParams = {
    id: string;
    courseName?: string;
};

const MapScreen = () => {

  const route = useRoute();
  const activeTab: TabName = route.name === "Courses" ? "courses" : "courses";
  const { id, courseName } = route.params as CourseScreenRouteParams;

  return (
    <View style={styles.containerLight}>
      <Header title="Map" />

      <View style={styles.content}>

        <Map courseId={id} courseName={courseName} />
      </View>

      <Footer activeTab={activeTab} />
    </View>
  );
};

export default MapScreen;
