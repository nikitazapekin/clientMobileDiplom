import { Image, Text, View } from "react-native";
import type { StackNavigationProp } from "@react-navigation/stack";

import CustomButton from "../shared/Button";

import { styles } from "./styled";

import { LogoImage } from "@/constants/icons";
import { ROUTES } from "@/navigation/routes";

type RootStackParamList = {
  Home: undefined;
  [ROUTES.STACK.AUTH]: undefined;
  [ROUTES.STACK.REGISTER]: undefined;
  [ROUTES.STACK.MAIN]: undefined;
  [ROUTES.STACK.DOCTOR]: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const WelcomeComponent = ({ navigation }: HomeScreenProps) => {
  const handleContinue = () => {
    navigation.navigate(ROUTES.STACK.AUTH);
  };

  return (
    <View style={styles.centerContent}>
      <Text style={styles.title}>Добро пожаловать</Text>
      <Image source={LogoImage} style={styles.image} resizeMode="contain" />
      <CustomButton handler={handleContinue} text="Продолжить" backgroundColor="#1280b2" />
      <View style={styles.gap} />

    </View>
  );
};

export default WelcomeComponent;
