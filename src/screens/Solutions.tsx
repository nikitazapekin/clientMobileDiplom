import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, SIZES } from "appStyles";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { styles as screenStyles } from "./styles";

import {
  type CodeTaskSolution,
  CodingTasksService,
} from "@/http/codingTasksService";

interface Props {
  route: {
    params: {
      taskId: string;
      taskTitle: string;
    };
  };
}

type SolutionSortMode = "all" | "fastest" | "popular";

const UNKNOWN_NAME = "unknown";

const getErrorMessage = (error: unknown, fallbackMessage: string): string =>
  error instanceof Error && error.message ? error.message : fallbackMessage;

const getStudentDisplayName = (solution: CodeTaskSolution): string => {
  const directName = solution.studentName?.trim();

  if (directName && directName.toLowerCase() !== UNKNOWN_NAME) {
    return directName;
  }

  const fallbackName = [
    solution.client?.lastName?.trim(),
    solution.client?.firstName?.trim(),
    solution.client?.middleName?.trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fallbackName || "Студент";
};

const SolutionsScreen = ({ route }: Props) => {
  const { taskId, taskTitle } = route.params;
  const activeTab: TabName = "courses";

  const [solutions, setSolutions] = useState<CodeTaskSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SolutionSortMode>("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const storedEntries = await AsyncStorage.multiGet(["userAuditoryId", "userId"]);
        const storedValues = Object.fromEntries(storedEntries);

        setCurrentClientId(storedValues.userAuditoryId || storedValues.userId);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    })();
  }, []);

  const loadSolutions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CodingTasksService.getTaskSolutions(taskId);

      setSolutions(data);
    } catch (_error: unknown) {
      Alert.alert("Ошибка", "Не удалось загрузить решения");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadSolutions();
  }, [loadSolutions]);

  const handleLike = async (solutionId: string) => {
    try {
      const updated = await CodingTasksService.likeSolution(solutionId);

      setSolutions((prev) =>
        prev.map((solution) =>
          solution.id === solutionId
            ? {
              ...solution,
              ...updated,
              client: solution.client,
            }
            : solution,
        ),
      );
    } catch (error: unknown) {
      Alert.alert("Ошибка", getErrorMessage(error, "Не удалось поставить лайк"));
    }
  };

  const handleDislike = async (solutionId: string) => {
    try {
      const updated = await CodingTasksService.dislikeSolution(solutionId);

      setSolutions((prev) =>
        prev.map((solution) =>
          solution.id === solutionId
            ? {
              ...solution,
              ...updated,
              client: solution.client,
            }
            : solution,
        ),
      );
    } catch (error: unknown) {
      Alert.alert("Ошибка", getErrorMessage(error, "Не удалось поставить дизлайк"));
    }
  };

  const solvedSolutions = useMemo(
    () => solutions.filter((solution) => solution.allPassed),
    [solutions],
  );

  const availableLanguages = useMemo(
    () => Array.from(new Set(solvedSolutions.map((solution) => solution.language).filter(Boolean))),
    [solvedSolutions],
  );

  useEffect(() => {
    if (selectedLanguage !== "all" && !availableLanguages.includes(selectedLanguage)) {
      setSelectedLanguage("all");
    }
  }, [availableLanguages, selectedLanguage]);

  const filteredSolutions = useMemo(() => {
    const filteredByLanguage =
      selectedLanguage === "all"
        ? solvedSolutions
        : solvedSolutions.filter((solution) => solution.language === selectedLanguage);

    const next = [...filteredByLanguage];

    if (sortMode === "fastest") {
      next.sort(
        (a, b) =>
          a.executionTimeMs - b.executionTimeMs ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return next;
    }

    if (sortMode === "popular") {
      next.sort(
        (a, b) =>
          (b.likes || 0) - (a.likes || 0) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return next;
    }

    next.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return next;
  }, [selectedLanguage, solvedSolutions, sortMode]);

  return (
    <View style={screenStyles.containerLight}>
      <Header title="Solutions" />

      <View style={screenStyles.content}>
        <View style={st.content}>
          <View style={st.titleBlock}>
            <Text style={st.title}>{taskTitle}</Text>
            <Text style={st.subtitle}>Решенные решения студентов: {solvedSolutions.length}</Text>
          </View>

          <View style={st.controlsCard}>
            <Text style={st.controlsLabel}>Сортировка</Text>
            <View style={st.filtersRow}>
              <TouchableOpacity
                style={[st.filterBtn, sortMode === "all" && st.filterBtnActive]}
                onPress={() => setSortMode("all")}
              >
                <Text
                  style={[
                    st.filterBtnText,
                    sortMode === "all" && st.filterBtnTextActive,
                  ]}
                >
                  Все
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[st.filterBtn, sortMode === "fastest" && st.filterBtnActive]}
                onPress={() => setSortMode("fastest")}
              >
                <Text
                  style={[
                    st.filterBtnText,
                    sortMode === "fastest" && st.filterBtnTextActive,
                  ]}
                >
                  Самые быстрые
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[st.filterBtn, sortMode === "popular" && st.filterBtnActive]}
                onPress={() => setSortMode("popular")}
              >
                <Text
                  style={[
                    st.filterBtnText,
                    sortMode === "popular" && st.filterBtnTextActive,
                  ]}
                >
                  Самые популярные
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={st.controlsLabel}>Язык</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.languageRow}
            >
              <TouchableOpacity
                style={[
                  st.languageChip,
                  selectedLanguage === "all" && st.languageChipActive,
                ]}
                onPress={() => setSelectedLanguage("all")}
              >
                <Text
                  style={[
                    st.languageChipText,
                    selectedLanguage === "all" && st.languageChipTextActive,
                  ]}
                >
                  Все языки
                </Text>
              </TouchableOpacity>

              {availableLanguages.map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    st.languageChip,
                    selectedLanguage === language && st.languageChipActive,
                  ]}
                  onPress={() => setSelectedLanguage(language)}
                >
                  <Text
                    style={[
                      st.languageChipText,
                      selectedLanguage === language && st.languageChipTextActive,
                    ]}
                  >
                    {language.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={st.center}>
              <ActivityIndicator size="large" color={COLORS.ACCENT} />
            </View>
          ) : (
            <ScrollView style={st.list} contentContainerStyle={st.listContent}>
              {filteredSolutions.length === 0 ? (
                <View style={st.empty}>
                  <Text style={st.emptyText}>
                    {selectedLanguage === "all"
                      ? "Решенных решений пока нет"
                      : "Для выбранного языка решенных решений пока нет"}
                  </Text>
                </View>
              ) : (
                filteredSolutions.map((solution) => (
                  <View key={solution.id} style={st.card}>
                    <View style={st.cardHeader}>
                      <View style={st.studentMeta}>
                        <Text style={st.studentName}>{getStudentDisplayName(solution)}</Text>
                        <Text style={st.languageBadge}>{solution.language.toUpperCase()}</Text>
                      </View>

                      <View style={st.timeBadge}>
                        <Text style={st.timeBadgeText}>{solution.executionTimeMs} мс</Text>
                      </View>
                    </View>

                    <View style={st.codePreview}>
                      <Text style={st.codeTitle}>Код решения</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <Text style={st.code}>{solution.code}</Text>
                      </ScrollView>
                    </View>

                    <View style={st.cardFooter}>
                      <View style={st.likeButtons}>
                        <TouchableOpacity
                          style={[
                            st.likeBtn,
                            solution.likedBy?.includes(currentClientId || "") && st.likeBtnActive,
                          ]}
                          onPress={() => handleLike(solution.id)}
                        >
                          <Text style={st.likeBtnText}>👍 {solution.likes || 0}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            st.dislikeBtn,
                            solution.dislikedBy?.includes(currentClientId || "") &&
                              st.dislikeBtnActive,
                          ]}
                          onPress={() => handleDislike(solution.id)}
                        >
                          <Text style={st.dislikeBtnText}>👎 {solution.dislikes || 0}</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={st.timestamp}>
                        {new Date(solution.createdAt).toLocaleString("ru-RU")}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>

      <Footer activeTab={activeTab} />
    </View>
  );
};

const st = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: COLORS.GRAY_50,
    padding: SIZES.SPACING_MD,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    marginBottom: SIZES.SPACING_MD,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.GRAY_900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.GRAY_600,
  },
  controlsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    padding: SIZES.SPACING_MD,
    marginBottom: SIZES.SPACING_MD,
    gap: 10,
  },
  controlsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY_700,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: COLORS.ACCENT,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.GRAY_700,
    textAlign: "center",
  },
  filterBtnTextActive: {
    color: COLORS.WHITE,
  },
  languageRow: {
    gap: 8,
    paddingRight: 4,
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.GRAY_100,
  },
  languageChipActive: {
    backgroundColor: COLORS.ACCENT,
  },
  languageChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.GRAY_700,
  },
  languageChipTextActive: {
    color: COLORS.WHITE,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: SIZES.SPACING_MD,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.SPACING_LG,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  studentMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.GRAY_900,
  },
  languageBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.WHITE,
    backgroundColor: COLORS.ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e8f5e9",
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2e7d32",
  },
  codePreview: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 12,
  },
  codeTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#bdbdbd",
    marginBottom: 8,
  },
  code: {
    fontSize: 12,
    lineHeight: 18,
    color: "#d4d4d4",
    fontFamily: "monospace",
  },
  cardFooter: {
    marginTop: 12,
    gap: 10,
  },
  likeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_100,
  },
  likeBtnActive: {
    backgroundColor: "#e3f2fd",
  },
  likeBtnText: {
    fontSize: 14,
    color: COLORS.GRAY_700,
  },
  dislikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_100,
  },
  dislikeBtnActive: {
    backgroundColor: "#ffebee",
  },
  dislikeBtnText: {
    fontSize: 14,
    color: COLORS.GRAY_700,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.GRAY_500,
  },
});

export default SolutionsScreen;
