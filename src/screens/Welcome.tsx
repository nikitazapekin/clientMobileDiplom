
import React from "react";
import { Text,View } from "react-native";

import WelcomeComponent from "../components/WelcomeComponent";

import { styles } from "./styles";

export default function WelcomeScreen() {
  return (

    <>

      <View style={styles.container}>

        <WelcomeComponent />

      </View>
    </>
  );
}
