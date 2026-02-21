import React from "react";
import { View, Text, TouchableOpacity, Image, ImageSourcePropType } from "react-native";
import HomeIcon from "@/assets/tabs/home.png";
import AchievementsIcon from "@/assets/tabs/badge.png";
import ChatsIcon from "@/assets/tabs/chat.png";
import SandboxIcon from "@/assets/tabs/coding.png";
import ProfileIcon from "@/assets/tabs/user.png";
import { styles } from "./styles";

export type TabName = "courses" | "achievements" | "chats" | "sandbox" | "profile";

interface FooterProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export default function Footer({ activeTab, onTabPress }: FooterProps) {
  const tabs: { name: TabName; label: string , icon: ImageSourcePropType}[] = [
    { name: "courses", label: "Home", icon: HomeIcon},
    { name: "achievements", label: "Achievements" , icon: AchievementsIcon},
    { name: "chats", label: "Chats", icon: ChatsIcon },  
    { name: "sandbox", label: "Sandbox", icon: SandboxIcon }, 
      { name: "profile", label: "Profile", icon: ProfileIcon },
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
          <Image source={tab.icon} style={styles.footerButtonIcon} />
         
        </TouchableOpacity>
      ))}
    </View>
  );
}
