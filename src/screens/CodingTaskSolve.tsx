import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CodingTaskSolver from "@/components/CodingTaskSolver";

import { styles } from "./styles";

type RouteParams = {
  id: string;
};

const CodingTaskSolveScreen = () => {
  const route = useRoute();
  const activeTab: TabName = "courses";
  const { id } = route.params as RouteParams;

  return (
    <View style={styles.containerLight}>
      <Header title="Solve Task" />
      <View style={styles.content}>
        <CodingTaskSolver id={id} />
      </View>
      <Footer activeTab={activeTab} />
    </View>
  );
};

export default CodingTaskSolveScreen;
