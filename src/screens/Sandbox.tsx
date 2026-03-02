import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles } from "./styles";

export default function SandboxScreen() {
  const route = useRoute();
  const activeTab: TabName = route.name === "Sandbox" ? "sandbox" : "sandbox";

  return (
    <>
      <View style={styles.containerLight}>
        <Header title="Sandbox" />

        {/* Content */}
        <View style={styles.content}>
          {/* Sandbox content goes here */}
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
