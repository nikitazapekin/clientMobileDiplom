import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

const styles = StyleSheet.create({
  course: {
    backgroundColor: COLORS.WHITE,
    borderColor: "#EAEAEA",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  mediaColumn: {
    width: 92,
  },
  courseImage: {
    borderRadius: 18,
    height: 92,
    width: 92,
  },
  courseImagePlaceholder: {
    alignItems: "center",
    backgroundColor: COLORS.GRAY_100,
    justifyContent: "center",
  },
  courseImagePlaceholderText: {
    color: COLORS.GRAY_500,
    fontSize: 22,
    fontWeight: "700",
  },
  contentColumn: {
    flex: 1,
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  courseTitle: {
    color: COLORS.GRAY_900,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  statusBadge: {
    backgroundColor: "#F3F3F3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: COLORS.GRAY_600,
    fontSize: 11,
    fontWeight: "600",
  },
  courseDescription: {
    color: COLORS.GRAY_600,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    backgroundColor: "#FAFAFA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    color: COLORS.GRAY_700,
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 10,
  },
  statsText: {
    color: COLORS.GRAY_500,
    fontSize: 12,
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#FFF6DA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: "#836400",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  bottomMetaText: {
    color: COLORS.GRAY_500,
    fontSize: 12,
    fontWeight: "500",
  },
  bottomActionText: {
    color: COLORS.ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
});
