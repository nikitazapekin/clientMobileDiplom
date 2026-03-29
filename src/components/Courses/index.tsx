import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "appStyles";

import Course from "../Course";

import { styles } from "./styled";

import CourseService from "@/http/courses";
import SubscriptionService from "@/http/subscribtion";
import type { CourseResponse, StudentCourseResponse } from "@/http/types/course";

const normalizeValue = (value: string) => value.trim().toLowerCase();

type CoursesMode = "all" | "subscribed";
type CourseListItem = CourseResponse | StudentCourseResponse;

interface CoursesListProps {
  mode?: CoursesMode;
}

const isSubscribedCourse = (course: CourseListItem): course is StudentCourseResponse =>
  "subscribedAt" in course;

export default function CoursesList({ mode = "all" }: CoursesListProps) {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [visibleCourses, setVisibleCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        mode === "subscribed"
          ? await (async () => {
            const auditoryId = await AsyncStorage.getItem("userId");

            return SubscriptionService.getStudentCourses(auditoryId ?? "");
          })()
          : await CourseService.getPublishedCourses();

      const sortedCourses = [...response].sort((left, right) => {
        const rightDate = isSubscribedCourse(right)
          ? right.subscribedAt
          : right.publishedAt ?? right.createdAt;
        const leftDate = isSubscribedCourse(left)
          ? left.subscribedAt
          : left.publishedAt ?? left.createdAt;

        return new Date(rightDate).getTime() - new Date(leftDate).getTime();
      });

      setCourses(sortedCourses);
      setError(null);
    } catch (loadError: unknown) {
      console.error(`Failed to load ${mode} courses:`, loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : mode === "subscribed"
            ? "Не удалось загрузить ваши курсы"
            : "Не удалось загрузить каталог курсов",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode]);

  useFocusEffect(
    useCallback(() => {
      void loadCourses();
    }, [loadCourses]),
  );

  useEffect(() => {
    const normalizedQuery = normalizeValue(searchQuery);

    if (!normalizedQuery) {
      setVisibleCourses(courses);

      return;
    }

    setVisibleCourses(
      courses.filter((course) => {
        const haystack = [
          course.title,
          course.description,
          course.language,
          course.type,
          ...(course.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      }),
    );
  }, [courses, searchQuery]);

  const publishedCount = courses.filter((course) => course.status === "published").length;
  const heroOverline = mode === "subscribed" ? "Личный кабинет" : "Каталог";
  const heroTitle = mode === "subscribed" ? "Мои курсы" : "Все курсы";
  const heroDescription =
    mode === "subscribed"
      ? "Все подписки студента в одном месте: открывайте курсы, продолжайте обучение и быстро возвращайтесь к нужным материалам."
      : "Здесь собраны все доступные курсы. Открывайте программы, изучайте описание и подписывайтесь на интересующие направления.";
  const loadingText = mode === "subscribed" ? "Загружаем ваши курсы..." : "Загружаем каталог курсов...";
  const secondaryLabel = mode === "subscribed" ? "Активных" : "Опубликовано";
  const emptyTitle = searchQuery
    ? "Ничего не найдено"
    : mode === "subscribed"
      ? "У вас пока нет курсов"
      : "Курсы пока недоступны";
  const emptyDescription = searchQuery
    ? "Попробуйте изменить поисковый запрос или очистить фильтр."
    : mode === "subscribed"
      ? "После подписки курс появится здесь автоматически."
      : "Когда в системе появятся опубликованные курсы, они отобразятся в этом каталоге.";
  const emptyButtonText = searchQuery ? "Сбросить поиск" : "Обновить список";

  if (loading && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.ACCENT} size="large" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroOverline}>{heroOverline}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroDescription}>{heroDescription}</Text>
 
      </View>

      <View style={styles.searchBlock}>
        <TextInput
          onChangeText={setSearchQuery}
          placeholder="Поиск по названию, описанию или тегам"
          placeholderTextColor="#9C9C9C"
          returnKeyType="search"
          style={styles.searchInput}
          value={searchQuery}
        />

        {searchQuery.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={[
          styles.listContent,
          visibleCourses.length === 0 && styles.listContentEmpty,
        ]}
        data={visibleCourses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyDescription}>{emptyDescription}</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (searchQuery) {
                  setSearchQuery("");

                  return;
                }

                void loadCourses(true);
              }}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>{emptyButtonText}</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => void loadCourses(true)}
            refreshing={refreshing}
            tintColor={COLORS.ACCENT}
          />
        }
        renderItem={({ item }) => <Course item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
