import React from "react";
import { View, Text, TouchableOpacity, Image, ImageSourcePropType } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { MainTabNavigationProp, RootStackNavigationProp } from "@/navigation/types";
import HomeIcon from "@/assets/tabs/home.png";
import AchievementsIcon from "@/assets/tabs/badge.png";
import ChatsIcon from "@/assets/tabs/chat.png";
import SandboxIcon from "@/assets/tabs/coding.png";
import ProfileIcon from "@/assets/tabs/user.png";
import { styles } from "./styles";

export type TabName = "courses" | "achievements" | "chats" | "sandbox" | "profile";

type RouteName = "Courses" | "Achievements" | "Chats" | "Sandbox" | "Profile";

interface FooterProps {
  activeTab: TabName;
}

export default function Footer({ activeTab }: FooterProps) {
  const navigation = useNavigation<RootStackNavigationProp>();

  const tabs: { name: TabName; label: string; route: RouteName; icon: ImageSourcePropType }[] = [
    { name: "courses", label: "Home", route: "Courses", icon: HomeIcon },
    { name: "achievements", label: "Achievements", route: "Achievements", icon: AchievementsIcon },
    { name: "chats", label: "Chats", route: "Chats", icon: ChatsIcon },
    { name: "sandbox", label: "Sandbox", route: "Sandbox", icon: SandboxIcon },
    { name: "profile", label: "Profile", route: "Profile", icon: ProfileIcon },
  ];

  const handleTabPress = (route: RouteName) => {

    console.log("NAVIGATE")
    navigation.navigate(route);
  };

  return (
    <View style={styles.footer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={[
            styles.footerButton,
            activeTab === tab.name && styles.footerButtonActive,
          ]}
          onPress={() => handleTabPress(tab.route)}
        >
          <Image source={tab.icon} style={styles.footerButtonIcon} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
