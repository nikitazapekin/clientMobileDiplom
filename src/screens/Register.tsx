import RegisterForm from "@/components/RegisterForm"
import { styles } from "./styles";
import { View } from "react-native";
 const RegisterScreen = () => {
    return (
  <View style={styles.container}>

        <RegisterForm />
  </View>
    )
 }

 export default RegisterScreen