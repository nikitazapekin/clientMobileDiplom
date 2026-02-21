import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { styles } from "./styles";
import Header from "../components/Header";
import Footer, { TabName } from "../components/Footer";

export default function ChatsScreen() {
  const route = useRoute();
  const activeTab: TabName = route.name === "Chats" ? "chats" : "chats";

  return (
    <>
      <View style={styles.containerLight}>
        <Header title="Chats" />

        {/* Content */}
        <View style={styles.content}>
          {/* Chats content goes here */}
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
