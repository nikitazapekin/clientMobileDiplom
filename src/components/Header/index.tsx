import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import Logo from "../../assets/BigLogo.png";

import { DRAWER_WIDTH, styles } from "./styles";

import { ProfileService } from "@/http/profile";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp } from "@/navigation/types";

interface HeaderProps {
  title?: string;
}

type MenuRoute =
  | typeof ROUTES.STACK.COURSES
  | typeof ROUTES.STACK.MY_COURSES
  | typeof ROUTES.STACK.FRIENDS
  | typeof ROUTES.STACK.PROFILE
  | typeof ROUTES.STACK.FORUM
  | typeof ROUTES.STACK.ARTICLES;

interface DrawerProfileState {
  avatarUri: string | null;
  email: string;
  fullName: string;
  initials: string;
}

const MENU_ITEMS: { label: string; route: MenuRoute }[] = [
  { label: "Форум", route: ROUTES.STACK.FORUM },
  { label: "Статьи", route: ROUTES.STACK.ARTICLES },
  { label: "Друзья", route: ROUTES.STACK.FRIENDS },
  { label: "Мои курсы", route: ROUTES.STACK.MY_COURSES },
  { label: "Профиль", route: ROUTES.STACK.PROFILE },
];

const DEFAULT_PROFILE: DrawerProfileState = {
  avatarUri: null,
  email: "Нет данных",
  fullName: "Пользователь",
  initials: "П",
};

const getInitials = (value: string): string => {
  const parts = value
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return DEFAULT_PROFILE.initials;
  }

  return parts.map((item) => item[0]?.toUpperCase() ?? "").join("") || DEFAULT_PROFILE.initials;
};

const normalizeAvatarUri = (imageUrl?: string, mimeType?: string): string | null => {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return mimeType ? `data:${mimeType};base64,${imageUrl}` : null;
};

export default function Header({ title }: HeaderProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profile, setProfile] = useState<DrawerProfileState>(DEFAULT_PROFILE);
  const drawerTranslate = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const loadProfile = async () => {
    try {
      setIsProfileLoading(true);

      const storedEntries = await AsyncStorage.multiGet([
        "userId",
        "userEmail",
        "userFullName",
      ]);

      const storedValues = Object.fromEntries(storedEntries);
      const storedUserId = storedValues.userId;
      const fallbackFullName = storedValues.userFullName || DEFAULT_PROFILE.fullName;
      const fallbackEmail = storedValues.userEmail || DEFAULT_PROFILE.email;

      setProfile((previous) => ({
        ...previous,
        avatarUri: null,
        email: fallbackEmail,
        fullName: fallbackFullName,
        initials: getInitials(fallbackFullName),
      }));

      if (!storedUserId) {
        return;
      }

      const fullProfile = await ProfileService.getFullProfileByAuditoryId(storedUserId);
      const fullName = [fullProfile.firstName, fullProfile.lastName].filter(Boolean).join(" ").trim();

      setProfile({
        avatarUri: normalizeAvatarUri(fullProfile.avatar?.imageUrl, fullProfile.avatar?.mimeType),
        email: fullProfile.email || fallbackEmail,
        fullName: fullName || fallbackFullName,
        initials: getInitials(fullName || fallbackFullName),
      });
    } catch (error) {
      console.error("Failed to load profile for header drawer:", error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const openMenu = () => {
    setIsMenuVisible(true);

    Animated.parallel([
      Animated.timing(drawerTranslate, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    void loadProfile();
  };

  const closeMenu = (onClosed?: () => void) => {
    Animated.parallel([
      Animated.timing(drawerTranslate, {
        toValue: DRAWER_WIDTH,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsMenuVisible(false);
      onClosed?.();
    });
  };

  const handleNavigate = (route: MenuRoute) => {
    closeMenu(() => {
      navigation.navigate(route);
    });
  };

  return (
    <>
      <View accessibilityLabel={title || "Навигация"} style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate(ROUTES.STACK.COURSES)}
          style={styles.logoButton}
        >
          <Image
            resizeMode="cover"
            source={Logo}
            style={styles.logo}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={1} onPress={openMenu} style={styles.menuButton}>
          <View style={styles.menuBars}>
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="none"
        onRequestClose={() => closeMenu()}
        transparent={true}
        visible={isMenuVisible}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable onPress={() => closeMenu()} style={styles.backdropPressable} />
          </Animated.View>

          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerTranslate }] }]}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleNavigate(ROUTES.STACK.PROFILE)}
              style={styles.profileCard}
            >
              {isProfileLoading ? (
                <View style={[styles.avatarCircle, styles.avatarCircleLoading]}>
                  <ActivityIndicator color="#6B6B6B" size="small" />
                </View>
              ) : profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{profile.initials}</Text>
                </View>
              )}

              <View style={styles.profileTextBlock}>
                <Text numberOfLines={1} style={styles.profileName}>
                  {profile.fullName}
                </Text>
                <Text numberOfLines={1} style={styles.profileEmail}>
                  {profile.email}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuItems}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  activeOpacity={0.82}
                  key={item.route}
                  onPress={() => handleNavigate(item.route)}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
