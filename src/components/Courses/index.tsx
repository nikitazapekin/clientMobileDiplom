import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "appStyles";

import Course from "../Course";
import Loader from "../Loader";

import { styles } from "./styled";

import CourseService from "@/http/courses";
import SubscriptionService from "@/http/subscribtion";
import type {
  CourseResponse,
  CourseStatsResponse,
  StudentCourseResponse,
} from "@/http/types/course";

const normalizeValue = (value: string) => value.trim().toLowerCase();
const normalizeDateValue = (value: string) => value.trim();

const parseNumberFilter = (value: string) => {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

const parseDateFilter = (value: string) => {
  const normalized = normalizeDateValue(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const splitFilterTerms = (value: string) =>
  value
    .split(",")
    .map((item) => normalizeValue(item))
    .filter(Boolean);

type CoursesMode = "all" | "subscribed";
type CourseListItem = CourseResponse | StudentCourseResponse;

interface CourseFilters {
  createdFrom: string;
  createdTo: string;
  hashtags: string;
  keywords: string;
  maxLessons: string;
  maxStudents: string;
  minLessons: string;
  minStudents: string;
}

const DEFAULT_FILTERS: CourseFilters = {
  createdFrom: "",
  createdTo: "",
  hashtags: "",
  keywords: "",
  maxLessons: "",
  maxStudents: "",
  minLessons: "",
  minStudents: "",
};

interface CoursesListProps {
  mode?: CoursesMode;
}

const isSubscribedCourse = (course: CourseListItem): course is StudentCourseResponse =>
  "subscribedAt" in course;

const getCourseCreatedDate = (course: CourseListItem) =>
  isSubscribedCourse(course) ? course.publishedAt ?? course.subscribedAt : course.createdAt;

function FilterIcon() {
  return (
    <View style={styles.filterIcon}>
      <View style={[styles.filterLine, styles.filterLineWide]} />
      <View style={styles.filterDotTop} />
      <View style={[styles.filterLine, styles.filterLineMedium]} />
      <View style={styles.filterDotMiddle} />
      <View style={[styles.filterLine, styles.filterLineShort]} />
      <View style={styles.filterDotBottom} />
    </View>
  );
}

export default function CoursesList({ mode = "all" }: CoursesListProps) {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseStatsResponse | undefined>>({});
  const [visibleCourses, setVisibleCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<CourseFilters>(DEFAULT_FILTERS);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

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
      const statsEntries = await Promise.all(
        sortedCourses.map(async (course) => {
          try {
            const stats = await CourseService.getCourseStats(course.id);

            return [course.id, stats] as const;
          } catch (statsError) {
            console.error(`Failed to load stats for course ${course.id}:`, statsError);

            return [course.id, undefined] as const;
          }
        }),
      );

      setCourseStats(Object.fromEntries(statsEntries));
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
    const keywordTerms = splitFilterTerms(filters.keywords);
    const hashtagTerms = splitFilterTerms(filters.hashtags);
    const minLessons = parseNumberFilter(filters.minLessons);
    const maxLessons = parseNumberFilter(filters.maxLessons);
    const minStudents = parseNumberFilter(filters.minStudents);
    const maxStudents = parseNumberFilter(filters.maxStudents);
    const createdFrom = parseDateFilter(filters.createdFrom);
    const createdTo = parseDateFilter(filters.createdTo);

    setVisibleCourses(
      courses.filter((course) => {
        const generalHaystack = [
          course.title,
          course.description,
          course.language,
          course.type,
          ...(course.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();

        if (normalizedQuery && !generalHaystack.includes(normalizedQuery)) {
          return false;
        }

        const keywordHaystack = [
          course.title,
          course.description,
          course.language,
          course.type,
        ]
          .join(" ")
          .toLowerCase();

        if (keywordTerms.length > 0 && !keywordTerms.every((term) => keywordHaystack.includes(term))) {
          return false;
        }

        const normalizedTags = (course.tags ?? []).map((tag) => normalizeValue(tag));

        if (hashtagTerms.length > 0 && !hashtagTerms.every((term) => normalizedTags.includes(term))) {
          return false;
        }

        const stats = courseStats[course.id];

        if (minLessons !== null && (stats?.lessonCount ?? -1) < minLessons) {
          return false;
        }

        if (maxLessons !== null && (stats?.lessonCount ?? Number.POSITIVE_INFINITY) > maxLessons) {
          return false;
        }

        if (minStudents !== null && (stats?.studentCount ?? -1) < minStudents) {
          return false;
        }

        if (maxStudents !== null && (stats?.studentCount ?? Number.POSITIVE_INFINITY) > maxStudents) {
          return false;
        }

        const createdDate = new Date(getCourseCreatedDate(course));

        if (createdFrom && createdDate < createdFrom) {
          return false;
        }

        if (createdTo) {
          const createdToEnd = new Date(createdTo);

          createdToEnd.setHours(23, 59, 59, 999);

          if (createdDate > createdToEnd) {
            return false;
          }
        }

        return true;
      }),
    );
  }, [courseStats, courses, filters, searchQuery]);

  const activeFilterCount = Object.values(filters).filter((value) => value.trim().length > 0).length;
  const isSearchActive = searchQuery.length > 0 || activeFilterCount > 0;

  const publishedCount = courses.filter((course) => course.status === "published").length;
  const heroOverline = mode === "subscribed" ? "Личный кабинет" : "Каталог";
  const heroTitle = mode === "subscribed" ? "Мои курсы" : "Все курсы";
  const heroDescription =
    mode === "subscribed"
      ? "Все подписки студента в одном месте: открывайте курсы, продолжайте обучение и быстро возвращайтесь к нужным материалам."
      : "Здесь собраны все доступные курсы. Открывайте программы, изучайте описание и подписывайтесь на интересующие направления.";
  const secondaryLabel = mode === "subscribed" ? "Активных" : "Опубликовано";
  const emptyTitle = isSearchActive
    ? "Ничего не найдено"
    : mode === "subscribed"
      ? "У вас пока нет курсов"
      : "Курсы пока недоступны";
  const emptyDescription = isSearchActive
    ? "Попробуйте изменить поисковый запрос, фильтры или сбросить параметры."
    : mode === "subscribed"
      ? "После подписки курс появится здесь автоматически."
      : "Когда в системе появятся опубликованные курсы, они отобразятся в этом каталоге.";
  const emptyButtonText = isSearchActive ? "Сбросить поиск и фильтры" : "Обновить список";

  const openFilters = () => {
    setDraftFilters(filters);
    setIsFiltersVisible(true);
  };

  const closeFilters = () => {
    setDraftFilters(filters);
    setIsFiltersVisible(false);
  };

  const updateDraftFilter = (field: keyof CourseFilters, value: string) => {
    setDraftFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFiltersVisible(false);
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  if (loading && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroOverline}>{heroOverline}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        
   
      </View>

      <View style={styles.searchRow}>
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

        <TouchableOpacity activeOpacity={0.85} onPress={openFilters} style={styles.filterButton}>
          <FilterIcon />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
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
                if (isSearchActive) {
                  setSearchQuery("");
                  setFilters(DEFAULT_FILTERS);
                  setDraftFilters(DEFAULT_FILTERS);

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
        renderItem={({ item }) => <Course item={item} stats={courseStats[item.id]} />}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        onRequestClose={closeFilters}
        transparent={true}
        visible={isFiltersVisible}
      >
        <Pressable onPress={closeFilters} style={styles.modalOverlay}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Фильтры курсов</Text>
              <TouchableOpacity activeOpacity={0.75} onPress={closeFilters} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Ключевые слова</Text>
                <TextInput
                  onChangeText={(value) => updateDraftFilter("keywords", value)}
                  placeholder="Например: frontend, react"
                  placeholderTextColor="#9C9C9C"
                  style={styles.filterInput}
                  value={draftFilters.keywords}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Хештеги</Text>
                <TextInput
                  onChangeText={(value) => updateDraftFilter("hashtags", value.replace(/#/g, ""))}
                  placeholder="Например: javascript, basic"
                  placeholderTextColor="#9C9C9C"
                  style={styles.filterInput}
                  value={draftFilters.hashtags}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Количество уроков</Text>
                <View style={styles.rangeRow}>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateDraftFilter("minLessons", value)}
                    placeholder="От"
                    placeholderTextColor="#9C9C9C"
                    style={[styles.filterInput, styles.rangeInput]}
                    value={draftFilters.minLessons}
                  />
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateDraftFilter("maxLessons", value)}
                    placeholder="До"
                    placeholderTextColor="#9C9C9C"
                    style={[styles.filterInput, styles.rangeInput]}
                    value={draftFilters.maxLessons}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Количество студентов</Text>
                <View style={styles.rangeRow}>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateDraftFilter("minStudents", value)}
                    placeholder="От"
                    placeholderTextColor="#9C9C9C"
                    style={[styles.filterInput, styles.rangeInput]}
                    value={draftFilters.minStudents}
                  />
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateDraftFilter("maxStudents", value)}
                    placeholder="До"
                    placeholderTextColor="#9C9C9C"
                    style={[styles.filterInput, styles.rangeInput]}
                    value={draftFilters.maxStudents}
                  />
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Дата создания</Text>
                <View style={styles.rangeRow}>
                  <TextInput
                    onChangeText={(value) => updateDraftFilter("createdFrom", value)}
                    placeholder="От: 2026-05-01"
                    placeholderTextColor="#9C9C9C"
                    style={[styles.filterInput, styles.rangeInput]}
                    value={draftFilters.createdFrom}
                  />
                  <TextInput
                    onChangeText={(value) => updateDraftFilter("createdTo", value)}
                    placeholder="До: 2026-05-31"
                    placeholderTextColor="#9C9C9C"
                    style={[styles.filterInput, styles.rangeInput]}
                    value={draftFilters.createdTo}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity activeOpacity={0.85} onPress={resetFilters} style={styles.secondaryActionButton}>
                <Text style={styles.secondaryActionButtonText}>Сбросить</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={applyFilters} style={styles.primaryActionButton}>
                <Text style={styles.primaryActionButtonText}>Применить</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
