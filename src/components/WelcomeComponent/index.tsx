import { Button, Image, Text, View } from "react-native";
import LogoImage from "@assets/BigLogo.png";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

import CustomButton from "../Button";

import { styles } from "./styled";

import { ROUTES } from "@/navigation/routes";
import type { FormNavigationProp } from "@/navigation/types";

const WelcomeComponent = () => {

  const navigation = useNavigation<FormNavigationProp>();

  const handleNavigate= () => {
    navigation.navigate(ROUTES.STACK.AUTH);
  };

  return (
    <View style={styles.centerContent}>
      <Text style={styles.title}>Добро пожаловать</Text>
      <Image source={LogoImage} style={styles.image} resizeMode="contain" />

      <View style={styles.gap} />

      <CustomButton
        fullWidth={true}
        text="Продолжить"
        handler={handleNavigate}
      />
    </View>
  );
};

export default WelcomeComponent;
