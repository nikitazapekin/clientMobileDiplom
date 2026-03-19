import { Text,View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles } from "./styles";
 
import Lesson from "@/components/Lesson";
 
type CourseScreenRouteParams = {
    id: string;

};

const LessonScreen = () => {

  const route = useRoute();
  const activeTab: TabName = route.name === "Courses" ? "courses" : "courses";
  const { id } = route.params as CourseScreenRouteParams;

  console.log("PARENT", id);

  return (
    <View style={styles.containerLight}>
      <Header title="Map" />

      <View style={styles.content}>
        <Lesson  id={id} />
      </View>

      <Footer activeTab={activeTab} />
    </View>
  );
};

export default LessonScreen;
