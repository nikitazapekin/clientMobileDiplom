import React from "react";
import type { ImageSourcePropType } from "react-native";
import { Image, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { styles } from "./styles";

import AchievementsIcon from "@/assets/tabs/badge.png";
import ChatsIcon from "@/assets/tabs/chat.png";
import SandboxIcon from "@/assets/tabs/coding.png";
import HomeIcon from "@/assets/tabs/home.png";
import ProfileIcon from "@/assets/tabs/user.png";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp } from "@/navigation/types";

export type TabName = "courses" | "achievements" | "chats" | "sandbox" | "profile";

type FooterRouteName =
  | typeof ROUTES.STACK.COURSES
  | typeof ROUTES.STACK.ACHIEVEMENTS
  | typeof ROUTES.STACK.CHATS
  | typeof ROUTES.STACK.SANDBOX
  | typeof ROUTES.STACK.PROFILE;

interface FooterProps {
  activeTab: TabName;
}

const TABS: { icon: ImageSourcePropType; name: TabName; route: FooterRouteName }[] = [
  { name: "courses", route: ROUTES.STACK.COURSES, icon: HomeIcon },
  { name: "achievements", route: ROUTES.STACK.ACHIEVEMENTS, icon: AchievementsIcon },
  { name: "chats", route: ROUTES.STACK.CHATS, icon: ChatsIcon },
  { name: "sandbox", route: ROUTES.STACK.SANDBOX, icon: SandboxIcon },
  { name: "profile", route: ROUTES.STACK.PROFILE, icon: ProfileIcon },
];

export default function Footer({ activeTab }: FooterProps) {
  const navigation = useNavigation<RootStackNavigationProp>();

  return (
    <View style={styles.footer}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;

        return (
          <TouchableOpacity
            activeOpacity={0.82}
            key={tab.name}
            onPress={() => navigation.navigate(tab.route)}
            style={[styles.footerButton, isActive && styles.footerButtonActive]}
          >
            <Image
              source={tab.icon}
              style={[styles.footerButtonIcon, !isActive && styles.footerButtonIconInactive]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
