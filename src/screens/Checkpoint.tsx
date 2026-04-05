import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles } from "./styles";

import Checkpoint from "@/components/Checkpoint";

type CheckpointScreenRouteParams = {
  id: string;
};

const CheckpointScreen = () => {
  const route = useRoute();
  const activeTab: TabName = route.name === "Courses" ? "courses" : "courses";
  const { id } = route.params as CheckpointScreenRouteParams;

  return (
    <View style={styles.containerLight}>
      <Header title="Контрольная точка" />

      <View style={styles.content}>
        <Checkpoint id={id} />
      </View>

      <Footer activeTab={activeTab} />
    </View>
  );
};

export default CheckpointScreen;
