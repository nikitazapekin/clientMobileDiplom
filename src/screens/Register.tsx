import { View } from "react-native";

import { styles } from "./styles";

import RegisterForm from "@/components/RegisterForm";

const RegisterScreen = () => {
  return (
    <View style={styles.container}>

      <RegisterForm />
    </View>
  );
};

export default RegisterScreen;
