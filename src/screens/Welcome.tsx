 
 



 
import React from "react";
import { View, Text } from "react-native";

import { styles } from "./styles";
import WelcomeComponent from "../components/WelcomeComponent";

export default function WelcomeScreen() {
  return (
 
    <>

      <View style={styles.container}>

        <WelcomeComponent />

      </View>
    </>
  );
}
 