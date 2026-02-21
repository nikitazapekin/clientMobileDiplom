import { View, Text } from "react-native";
import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";
import CourseInfo from "@/components/CourseInfo";
import { useRoute } from "@react-navigation/native";
import Map from "@/components/Map";

type CourseScreenRouteParams = {
    id: string;

};

const MapScreen = () => {

     const route = useRoute();
        const activeTab: TabName = route.name === "Courses" ? "courses" : "courses";
        const { id } = route.params as CourseScreenRouteParams;

        
    return (
      <View style={styles.containerLight}>
                <Header title="Map" />


                <View style={styles.content}>

                   <Map  courseId={id}/>
                </View>

                <Footer activeTab={activeTab} />
            </View>
    );
};

export default MapScreen;