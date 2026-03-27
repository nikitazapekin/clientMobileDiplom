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

import SubscriptionService from "@/http/subscribtion";
import type { StudentCourseResponse } from "@/http/types/course";

const normalizeValue = (value: string) => value.trim().toLowerCase();

export default function CoursesList() {
  const [courses, setCourses] = useState<StudentCourseResponse[]>([]);
  const [visibleCourses, setVisibleCourses] = useState<StudentCourseResponse[]>([]);
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

      const auditoryId = await AsyncStorage.getItem("userId");
      const response = await SubscriptionService.getStudentCourses(auditoryId ?? "");
      const sortedCourses = [...response].sort(
        (left, right) => new Date(right.subscribedAt).getTime() - new Date(left.subscribedAt).getTime(),
      );

      setCourses(sortedCourses);
      setError(null);
    } catch (loadError: unknown) {
      console.error("Failed to load student courses:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить курсы студента");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  if (loading && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.ACCENT} size="large" />
        <Text style={styles.loadingText}>Загружаем ваши курсы...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroOverline}>Личный кабинет</Text>
        <Text style={styles.heroTitle}>Мои курсы</Text>
        <Text style={styles.heroDescription}>
          Все подписки студента в одном месте: открывайте курсы, продолжайте обучение и быстро
          возвращайтесь к нужным материалам.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{courses.length}</Text>
            <Text style={styles.summaryLabel}>Всего</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{publishedCount}</Text>
            <Text style={styles.summaryLabel}>Активных</Text>
          </View>
        </View>
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
            <Text style={styles.emptyTitle}>
              {searchQuery ? "Ничего не найдено" : "У вас пока нет курсов"}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? "Попробуйте изменить поисковый запрос или очистить фильтр."
                : "После подписки курс появится здесь автоматически."}
            </Text>
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
              <Text style={styles.emptyButtonText}>
                {searchQuery ? "Сбросить поиск" : "Обновить список"}
              </Text>
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
