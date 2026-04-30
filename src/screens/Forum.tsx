import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS, FONTS } from "appStyles";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import forumService from "@/http/forum";
import type { ForumQuestion, ForumQuestionStatus } from "@/http/types/community";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp } from "@/navigation/types";

const statusOptions: { label: string; value?: ForumQuestionStatus }[] = [
  { label: "Все", value: undefined },
  { label: "Открытые", value: "open" },
  { label: "Закрытые", value: "closed" },
];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function ForumScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<ForumQuestionStatus | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async (isRefresh = false) => {
    try {
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await forumService.getQuestions({
        limit: 50,
        page: 1,
        search: search.trim() || undefined,
        status,
        tag: tag.trim() || undefined,
      });

      setQuestions(response.items);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить форум");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status, tag]);

  useFocusEffect(
    useCallback(() => {
      void loadQuestions();
    }, [loadQuestions]),
  );

  return (
    <View style={styles.screen}>
      <Header title="Форум" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[COLORS.PRIMARY]}
            onRefresh={() => void loadQuestions(true)}
            refreshing={refreshing}
          />
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Форум</Text>
          <Text style={styles.heroTitle}>Вопросы по курсам, коду и заданиям</Text>
          <Text style={styles.heroText}>
            Ищи по названию и тегам, фильтруй открытые вопросы и публикуй свои разборы.
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate(ROUTES.STACK.FORUM_EDITOR)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Задать вопрос</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersCard}>
          <TextInput
            onChangeText={setSearch}
            placeholder="Поиск по названию"
            placeholderTextColor={COLORS.GRAY_400}
            style={styles.input}
            value={search}
          />

          <TextInput
            onChangeText={setTag}
            placeholder="Фильтр по тегу"
            placeholderTextColor={COLORS.GRAY_400}
            style={styles.input}
            value={tag}
          />

          <View style={styles.segmentRow}>
            {statusOptions.map((option) => {
              const active = option.value === status;

              return (
                <TouchableOpacity
                  activeOpacity={0.84}
                  key={option.label}
                  onPress={() => setStatus(option.value)}
                  style={[styles.segmentButton, active && styles.segmentButtonActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => void loadQuestions()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Применить фильтры</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={COLORS.PRIMARY} size="large" />
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => void loadQuestions()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        ) : questions.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>Ничего не найдено</Text>
            <Text style={styles.emptyText}>
              Попробуй другой запрос или создай первый вопрос по теме.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {questions.map((question) => (
              <TouchableOpacity
                activeOpacity={0.88}
                key={question.id}
                onPress={() =>
                  navigation.navigate(ROUTES.STACK.FORUM_QUESTION, {
                    questionId: question.id,
                  })
                }
                style={styles.questionCard}
              >
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.statusPill,
                      question.status === "closed" ? styles.statusClosed : styles.statusOpen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        question.status === "closed"
                          ? styles.statusClosedText
                          : styles.statusOpenText,
                      ]}
                    >
                      {question.status === "closed" ? "Закрыт" : "Открыт"}
                    </Text>
                  </View>

                  <Text style={styles.cardDate}>{formatDate(question.createdAt)}</Text>
                </View>

                <Text style={styles.questionTitle}>{question.title}</Text>
                <Text numberOfLines={3} style={styles.questionContent}>
                  {question.content}
                </Text>

                <View style={styles.tagsWrap}>
                  {question.tags.map((item) => (
                    <View key={`${question.id}-${item}`} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.authorText}>{question.authorName}</Text>
                  <Text style={styles.metaText}>{question.commentsCount} ответов</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Footer activeTab="courses" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F3F6ED",
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: COLORS.GRAY_DARK,
    borderRadius: 28,
    marginBottom: 16,
    overflow: "hidden",
    padding: 20,
  },
  heroEyebrow: {
    color: "#C3D4B6",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: COLORS.WHITE,
    fontSize: FONTS.SIZE.LG,
    fontWeight: "800",
    lineHeight: 30,
  },
  heroText: {
    color: "#DFE7D8",
    fontSize: FONTS.SIZE.SM,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 18,
  },
  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#9F0FA7",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  filtersCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  input: {
    backgroundColor: COLORS.GRAY_50,
    borderColor: COLORS.GRAY_200,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.SM,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  segmentButton: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  segmentButtonActive: {
    backgroundColor: "#9F0FA7",
  },
  segmentText: {
    color: COLORS.GRAY_700,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "white",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#9F0FA7",
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 24,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONTS.SIZE.SM,
    textAlign: "center",
  },
  emptyTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS.GRAY_600,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 22,
    textAlign: "center",
  },
  list: {
    gap: 14,
  },
  questionCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusOpen: {
    backgroundColor: "#EAF7E1",
  },
  statusClosed: {
    backgroundColor: "#FCEEEE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusOpenText: {
    color: COLORS.PRIMARY,
  },
  statusClosedText: {
    color: COLORS.ERROR,
  },
  cardDate: {
    color: COLORS.GRAY_500,
    fontSize: 12,
  },
  questionTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "800",
    lineHeight: 27,
  },
  questionContent: {
    color: COLORS.GRAY_700,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 23,
    marginTop: 8,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  tagChip: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tagText: {
    color: COLORS.GRAY_700,
    fontSize: 12,
    fontWeight: "700",
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  authorText: {
    color: COLORS.GRAY_DARK,
    fontSize: 13,
    fontWeight: "700",
  },
  metaText: {
    color: COLORS.GRAY_500,
    fontSize: 13,
  },
});
