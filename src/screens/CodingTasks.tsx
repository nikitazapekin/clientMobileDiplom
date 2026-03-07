import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CodingTasksList from "@/components/CodingTasks";

import { styles } from "./styles";

const CodingTasksScreen = () => {
  const route = useRoute();
  const activeTab: TabName = "courses";

  return (
    <View style={styles.containerLight}>
      <Header title="Coding Tasks" />
      <View style={styles.content}>
        <CodingTasksList />
      </View>
      <Footer activeTab={activeTab} />
    </View>
  );
};

export default CodingTasksScreen;
