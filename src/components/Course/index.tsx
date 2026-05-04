import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./styles";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "appStyles";

import { BASE_URL } from "@/http/api";
import CourseService from "@/http/courses";
import type {
  CourseResponse,
  CourseStatsResponse,
  StudentCourseResponse,
} from "@/http/types/course";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp } from "@/navigation/types";

interface CourseProps {
  item: CourseResponse | StudentCourseResponse;
  onPress?: () => void;
}

const STATUS_LABELS = {
  archived: "Архив",
  draft: "Черновик",
  published: "Опубликован",
} as const;

const getValidImageSrc = (logo: string): string | null => {
  if (!logo || typeof logo !== "string" || !logo.trim()) {
    return null;
  }

  const trimmed = logo.trim();

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${BASE_URL}${trimmed}`;
  }

  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(trimmed.slice(0, 120)) && trimmed.length > 120;

  if (maybeBase64) {
    return `data:image/png;base64,${trimmed}`;
  }

  return null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const hasSubscriptionDate = (
  item: CourseResponse | StudentCourseResponse,
): item is StudentCourseResponse => "subscribedAt" in item;

export default function Course({ item, onPress }: CourseProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const imageSrc = getValidImageSrc(item.logo);
  const [stats, setStats] = useState<CourseStatsResponse | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadCourseStats = async () => {
      try {
        const courseStats = await CourseService.getCourseStats(item.id);

        if (isActive) {
          setStats(courseStats);
        }
      } catch (error) {
        console.error("Failed to load course stats:", error);

        if (isActive) {
          setStats(null);
        }
      }
    };

    setStats(null);
    void loadCourseStats();

    return () => {
      isActive = false;
    };
  }, [item.id]);

  const handlePress = () => {
    if (onPress) {
      onPress();

      return;
    }

    navigation.navigate(ROUTES.STACK.COURSE, { id: item.id });
  };

  const subscribedAt = hasSubscriptionDate(item) ? formatDate(item.subscribedAt) : null;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={styles.course}>
      <View style={styles.mediaColumn}>
        {imageSrc ? (
          <Image
            resizeMode="cover"
            source={{ uri: imageSrc }}
            style={styles.courseImage}
          />
        ) : (
          <View style={[styles.courseImage, styles.courseImagePlaceholder]}>
            <Text style={styles.courseImagePlaceholderText}>{item.language.slice(0, 2).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.contentColumn}>
        <View style={styles.topRow}>
          <Text numberOfLines={2} style={styles.courseTitle}>
            {item.title}
          </Text>
          
        </View>

        <Text numberOfLines={3} style={styles.courseDescription}>
          {item.description}
        </Text>

        <View style={styles.metaChips}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{item.language}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{item.type}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>Уроков: {stats?.lessonCount ?? "..."}</Text>
          <Text style={styles.statsText}>Студентов: {stats?.studentCount ?? "..."}</Text>
        </View>

        {item.tags?.length ? (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

     
      </View>
    </TouchableOpacity>
  );
}

 