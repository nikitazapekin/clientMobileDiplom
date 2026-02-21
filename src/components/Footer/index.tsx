import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { styles } from "./styles";

export type TabName = "courses" | "achievements" | "chats" | "sandbox" | "profile";

interface FooterProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export default function Footer({ activeTab, onTabPress }: FooterProps) {
  const tabs: { name: TabName; label: string }[] = [
    { name: "courses", label: "Home" },
    { name: "achievements", label: "Achievements" },
    { name: "chats", label: "Chats" },
    { name: "sandbox", label: "Sandbox" }, 
      { name: "profile", label: "Profile" },
  ];

  return (
    <View style={styles.footer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[
            styles.footerButton,
            activeTab === tab.name && styles.footerButtonActive,
          ]}
          onPress={() => onTabPress(tab.name)}
        >
          <Text
            style={[
              styles.footerButtonText,
              activeTab === tab.name && styles.footerButtonTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
