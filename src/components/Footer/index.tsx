import React from "react";
import type { ImageSourcePropType} from "react-native";
import { Image,Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { styles } from "./styles";

import AchievementsIcon from "@/assets/tabs/badge.png";
import ChatsIcon from "@/assets/tabs/chat.png";
import SandboxIcon from "@/assets/tabs/coding.png";
import HomeIcon from "@/assets/tabs/home.png";
import ProfileIcon from "@/assets/tabs/user.png";
import type { MainTabNavigationProp, RootStackNavigationProp } from "@/navigation/types";
import { ROUTES } from "@/navigation/routes";

export type TabName = "courses" | "achievements" | "chats" | "sandbox" | "profile";

type RouteName =
  | typeof ROUTES.STACK.COURSES
  | typeof ROUTES.STACK.ACHIEVEMENTS
  | typeof ROUTES.STACK.CHATS
  | typeof ROUTES.STACK.SANDBOX
  | typeof ROUTES.STACK.PROFILE;

interface FooterProps {
  activeTab: TabName;
}

export default function Footer({ activeTab }: FooterProps) {
  const navigation = useNavigation<RootStackNavigationProp>();

  const tabs: { name: TabName; label: string; route: RouteName; icon: ImageSourcePropType }[] = [
    { name: "courses", label: "Home", route: ROUTES.STACK.COURSES, icon: HomeIcon },
    { name: "achievements", label: "Achievements", route: ROUTES.STACK.ACHIEVEMENTS, icon: AchievementsIcon },
    { name: "chats", label: "Chats", route: ROUTES.STACK.CHATS, icon: ChatsIcon },
    { name: "sandbox", label: "Sandbox", route: ROUTES.STACK.SANDBOX, icon: SandboxIcon },
    { name: "profile", label: "Profile", route: ROUTES.STACK.PROFILE, icon: ProfileIcon },
  ];

  const handleTabPress = (route: RouteName) => {

    console.log("NAVIGATE to", route);
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
