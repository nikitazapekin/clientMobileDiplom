import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { COLORS, SIZES } from "appStyles";
import {
  CodingTasksService,
  type CodeTaskSolution,
} from "@/http/codingTasksService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  route: {
    params: {
      taskId: string;
      taskTitle: string;
    };
  };
}

const SolutionsScreen = ({ route }: Props) => {
  const { taskId, taskTitle } = route.params;
  const [solutions, setSolutions] = useState<CodeTaskSolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "passed" | "fastest">("all");
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);

  useEffect(() => {
    loadSolutions();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const auditoryId = await AsyncStorage.getItem("userAuditoryId") || 
                         await AsyncStorage.getItem("userId");
      setCurrentClientId(auditoryId);
    } catch (e) {
      console.error("Failed to load user:", e);
    }
  };

  const loadSolutions = async () => {
    try {
      setLoading(true);
      const data = await CodingTasksService.getTaskSolutions(taskId);
      setSolutions(data);
    } catch (e: any) {
      Alert.alert("Ошибка", "Не удалось загрузить решения");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (solutionId: string) => {
    try {
      const updated = await CodingTasksService.likeSolution(solutionId);
      setSolutions((prev) =>
        prev.map((s) => (s.id === solutionId ? updated : s)),
      );
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message || "Не удалось поставить лайк");
    }
  };

  const handleDislike = async (solutionId: string) => {
    try {
      const updated = await CodingTasksService.dislikeSolution(solutionId);
      setSolutions((prev) =>
        prev.map((s) => (s.id === solutionId ? updated : s)),
      );
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message || "Не удалось поставить дизлайк");
    }
  };

  const getFilteredSolutions = () => {
    let filtered = [...solutions];

    if (filter === "passed") {
      filtered = filtered.filter((s) => s.allPassed);
    } else if (filter === "fastest") {
      const passed = filtered.filter((s) => s.allPassed);
      passed.sort((a, b) => a.executionTimeMs - b.executionTimeMs);
      filtered = passed;
    }

    return filtered;
  };

  const filteredSolutions = getFilteredSolutions();

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  return (
    <View style={st.container}>
      <View style={st.header}>
        <Text style={st.title}>📝 Решения: {taskTitle}</Text>
      </View>

      <View style={st.filters}>
        <TouchableOpacity
          style={[st.filterBtn, filter === "all" && st.filterBtnActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[st.filterBtnText, filter === "all" && st.filterBtnTextActive]}>
            Все ({solutions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.filterBtn, filter === "passed" && st.filterBtnActive]}
          onPress={() => setFilter("passed")}
        >
          <Text style={[st.filterBtnText, filter === "passed" && st.filterBtnTextActive]}>
            ✅ Решены ({solutions.filter((s) => s.allPassed).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.filterBtn, filter === "fastest" && st.filterBtnActive]}
          onPress={() => setFilter("fastest")}
        >
          <Text style={[st.filterBtnText, filter === "fastest" && st.filterBtnTextActive]}>
            ⚡ Быстрые
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.list} contentContainerStyle={st.listContent}>
        {filteredSolutions.length === 0 ? (
          <View style={st.empty}>
            <Text style={st.emptyText}>Нет решений</Text>
          </View>
        ) : (
          filteredSolutions.map((solution) => (
            <View key={solution.id} style={st.card}>
              <View style={st.cardHeader}>
                <View style={st.studentInfo}>
                  <Text style={st.studentName}>{solution.studentName}</Text>
                  <Text style={st.language}>{solution.language.toUpperCase()}</Text>
                </View>
                <View style={st.resultBadge}>
                  <Text
                    style={[
                      st.resultBadgeText,
                      solution.allPassed ? st.resultBadgeTextPassed : st.resultBadgeTextFailed,
                    ]}
                  >
                    {solution.allPassed ? "✅ Решено" : "❌ Не решено"}
                  </Text>
                </View>
              </View>

              <View style={st.stats}>
                <View style={st.stat}>
                  <Text style={st.statLabel}>Тесты:</Text>
                  <Text style={st.statValue}>
                    {solution.testCasesPassed}/{solution.totalTestCases}
                  </Text>
                </View>
                <View style={st.stat}>
                  <Text style={st.statLabel}>Время:</Text>
                  <Text
                    style={[
                      st.statValue,
                      solution.executionTimeMs < 1000
                        ? st.statValueFast
                        : solution.executionTimeMs < 2000
                        ? st.statValueMedium
                        : st.statValueSlow,
                    ]}
                  >
                    {solution.executionTimeMs}мс
                  </Text>
                </View>
                {solution.experienceGained > 0 && (
                  <View style={st.stat}>
                    <Text style={st.statLabel}>XP:</Text>
                    <Text style={[st.statValue, { color: COLORS.ACCENT }]}>
                      +{solution.experienceGained}
                    </Text>
                  </View>
                )}
              </View>

              {solution.testResults && solution.testResults.length > 0 && (
                <View style={st.testResults}>
                  <Text style={st.testResultsTitle}>Результаты тестов:</Text>
                  {solution.testResults.slice(0, 3).map((test, idx) => (
                    <View key={idx} style={st.testResult}>
                      <Text style={test.passed ? st.testResultPassed : st.testResultFailed}>
                        {test.passed ? "✅" : "❌"} Тест #{test.index + 1}
                      </Text>
                      {idx < Math.min(3, solution.testResults.length) - 1 && (
                        <Text style={st.testResultInput}>Вход: {test.input}</Text>
                      )}
                    </View>
                  ))}
                  {solution.testResults.length > 3 && (
                    <Text style={st.moreTests}>
                      ...и еще {solution.testResults.length - 3} тестов
                    </Text>
                  )}
                </View>
              )}

              <View style={st.codePreview}>
                <Text style={st.codeTitle}>Код решения:</Text>
                <Text style={st.code} numberOfLines={4}>
                  {solution.code}
                </Text>
              </View>

              <View style={st.likeButtons}>
                <TouchableOpacity
                  style={[
                    st.likeBtn,
                    solution.likedBy?.includes(currentClientId || "") && st.likeBtnActive,
                  ]}
                  onPress={() => handleLike(solution.id)}
                >
                  <Text style={st.likeBtnText}>
                    {solution.likedBy?.includes(currentClientId || "") ? "👍" : "👍"} {solution.likes || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    st.dislikeBtn,
                    solution.dislikedBy?.includes(currentClientId || "") && st.dislikeBtnActive,
                  ]}
                  onPress={() => handleDislike(solution.id)}
                >
                  <Text style={st.dislikeBtnText}>
                    {solution.dislikedBy?.includes(currentClientId || "") ? "👎" : "👎"} {solution.dislikes || 0}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={st.timestamp}>
                {new Date(solution.createdAt).toLocaleString("ru-RU")}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.GRAY_50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: COLORS.WHITE,
    padding: SIZES.SPACING_MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.GRAY_900 },

  filters: {
    flexDirection: "row",
    backgroundColor: COLORS.WHITE,
    padding: SIZES.SPACING_SM,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_100,
    alignItems: "center",
  },
  filterBtnActive: { backgroundColor: COLORS.ACCENT },
  filterBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.GRAY_600 },
  filterBtnTextActive: { color: "#fff" },

  list: { flex: 1 },
  listContent: { padding: SIZES.SPACING_MD, paddingBottom: 60 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.SPACING_LG,
  },
  emptyText: { fontSize: 14, color: COLORS.GRAY_500 },

  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  studentInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  studentName: { fontSize: 15, fontWeight: "600", color: COLORS.GRAY_900 },
  language: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: COLORS.ACCENT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  resultBadgeText: { fontSize: 11, fontWeight: "700" },
  resultBadgeTextPassed: { color: "#4caf50" },
  resultBadgeTextFailed: { color: "#f44336" },

  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.GRAY_50,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 11, color: COLORS.GRAY_500, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: "700", color: COLORS.GRAY_900 },
  statValueFast: { color: "#4caf50" },
  statValueMedium: { color: "#ff9800" },
  statValueSlow: { color: "#f44336" },

  testResults: { marginBottom: 10 },
  testResultsTitle: { fontSize: 12, fontWeight: "600", color: COLORS.GRAY_700, marginBottom: 6 },
  testResult: { marginBottom: 4 },
  testResultPassed: { fontSize: 12, color: "#4caf50" },
  testResultFailed: { fontSize: 12, color: "#f44336" },
  testResultInput: { fontSize: 11, color: COLORS.GRAY_500, marginLeft: 18 },
  moreTests: { fontSize: 11, color: COLORS.GRAY_400, fontStyle: "italic" },

  codePreview: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  codeTitle: {
    fontSize: 11,
    color: "#aaa",
    marginBottom: 6,
    fontWeight: "600",
  },
  code: {
    fontSize: 11,
    color: "#d4d4d4",
    fontFamily: "monospace",
  },

  timestamp: {
    fontSize: 10,
    color: COLORS.GRAY_400,
    textAlign: "right",
  },

  likeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.GRAY_100,
    gap: 4,
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
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.GRAY_100,
    gap: 4,
  },
  dislikeBtnActive: {
    backgroundColor: "#ffebee",
  },
  dislikeBtnText: {
    fontSize: 14,
    color: COLORS.GRAY_700,
  },
});

export default SolutionsScreen;
