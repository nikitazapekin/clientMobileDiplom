import React, { useCallback, useEffect, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { COLORS, SIZES } from "appStyles";

import { type CodeTask, CodingTasksService, type StudentLevel } from "@/http/codingTasksService";
import { ROUTES } from "@/navigation/routes";
import type { RootStackParamList } from "@/navigation/types";

const DIFFICULTIES: Record<string, { label: string; color: string }> = {
  easy: { label: "Легкий", color: "#4caf50" },
  medium: { label: "Средний", color: "#ff9800" },
  hard: { label: "Сложный", color: "#f44336" },
};

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  php: "PHP",
  ruby: "Ruby",
  rust: "Rust",
  csharp: "C#",
  java: "Java",
  golang: "Go",
  cpp: "C++",
};

const CodingTasksList = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [tasks, setTasks] = useState<CodeTask[]>([]);
  const [studentLevel, setStudentLevel] = useState<StudentLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [tasksData, levelData] = await Promise.all([
        CodingTasksService.getAllTasks(),
        CodingTasksService.getStudentLevel().catch(() => null),
      ]);

      setTasks(tasksData);
      setStudentLevel(levelData);
    } catch (e) {
      console.error("Failed to load coding tasks:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const solvedTaskIds = new Set(studentLevel?.solvedTasks?.map((s) => s.codeTaskId) ?? []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    const matchesDifficulty = filter === "all" || task.difficulty === filter;
    const searchTarget = [task.title, ...(task.tags || [])].join(" ").toLowerCase();
    const matchesSearch = normalizedQuery.length === 0 || searchTarget.includes(normalizedQuery);

    return matchesDifficulty && matchesSearch;
  });

  const getRequiredExp = (level: number) => Math.pow(10, level - 1);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {studentLevel && (
        <View style={s.levelCard}>
          <View style={s.levelRow}>
            <Text style={s.levelLabel}>Уровень</Text>
            <Text style={s.levelValue}>{studentLevel.level}</Text>
          </View>
          <View style={s.xpBar}>
            <View
              style={[
                s.xpFill,
                {
                  width: `${Math.min(
                    (studentLevel.experience / getRequiredExp(studentLevel.level)) * 100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={s.xpText}>
            {studentLevel.experience} / {getRequiredExp(studentLevel.level)} XP
          </Text>
          <Text style={s.solvedText}>
            Решено задач: {studentLevel.solvedTasks?.length ?? 0}
          </Text>
        </View>
      )}

      <View style={s.filters}>
        {[
          { key: "all", label: "Все" },
          { key: "easy", label: "Легкий" },
          { key: "medium", label: "Средний" },
          { key: "hard", label: "Сложный" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              s.filterBtn,
              filter === f.key && s.filterActive,
              filter === f.key &&
                f.key !== "all" && {
                backgroundColor: DIFFICULTIES[f.key]?.color,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[s.filterText, filter === f.key && s.filterTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Поиск по названию или тегу"
        placeholderTextColor={COLORS.GRAY_400}
        style={s.searchInput}
      />

      {filteredTasks.length === 0 ? (
        <Text style={s.emptyText}>Нет доступных задач</Text>
      ) : (
        filteredTasks.map((task) => {
          const isSolved = solvedTaskIds.has(task.id);
          const diffInfo = DIFFICULTIES[task.difficulty] || DIFFICULTIES.easy;

          return (
            <TouchableOpacity
              key={task.id}
              style={[s.taskCard, isSolved && s.taskCardSolved]}
              onPress={() =>
                navigation.navigate(ROUTES.STACK.CODING_SOLVE as any, { id: task.id })
              }
            >
              <View style={s.taskHeader}>
                <Text style={[s.taskTitle, isSolved && s.taskTitleSolved]} numberOfLines={1}>
                  {task.title}
                </Text>
                <View style={s.taskHeaderBadges}>
                  {isSolved && (
                    <View style={s.solvedBadge}>
                      <Text style={s.solvedBadgeText}>Решено</Text>
                    </View>
                  )}
                  <View style={[s.badge, { backgroundColor: diffInfo.color }]}>
                    <Text style={s.badgeText}>{diffInfo.label}</Text>
                  </View>
                </View>
              </View>
              {(task.tags || []).length > 0 && (
                <View style={s.taskTags}>
                  {(task.tags || []).map((tag) => (
                    <View key={tag} style={s.taskTag}>
                      <Text style={s.taskTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={s.taskFooter}>
                <Text style={s.taskMeta}>
                  {(task.languages || [])
                    .map((language) => LANGUAGE_LABELS[language] || language)
                    .join(", ")} | {task.testCases?.length ?? 0} тестов
                </Text>
                <View style={s.xpBadge}>
                  <Text style={s.xpBadgeText}>+{task.experienceReward} XP</Text>
                </View>
              </View>
              <Text style={s.authorText}>Автор: {task.authorName}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.GRAY_50 },
  content: { padding: SIZES.SPACING_MD, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  levelCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: SIZES.SPACING_MD,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelLabel: { fontSize: 14, color: COLORS.GRAY_500, fontWeight: "600" },
  levelValue: { fontSize: 28, fontWeight: "700", color: COLORS.ACCENT },
  xpBar: {
    height: 8,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  xpFill: {
    height: "100%",
    backgroundColor: COLORS.ACCENT,
    borderRadius: 4,
  },
  xpText: { fontSize: 12, color: COLORS.GRAY_500, textAlign: "right" },
  solvedText: { fontSize: 13, color: COLORS.GRAY_600, marginTop: 4 },

  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: SIZES.SPACING_MD,
    flexWrap: "wrap",
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.GRAY_BORDER,
    backgroundColor: COLORS.WHITE,
  },
  filterActive: {
    backgroundColor: COLORS.ACCENT,
    borderColor: COLORS.ACCENT,
  },
  filterText: { fontSize: 14, color: COLORS.GRAY_700 },
  filterTextActive: { color: COLORS.WHITE, fontWeight: "600" },
  searchInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.GRAY_BORDER,
    color: COLORS.GRAY_900,
    fontSize: 14,
    marginBottom: SIZES.SPACING_MD,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  emptyText: {
    textAlign: "center",
    color: COLORS.GRAY_400,
    marginTop: 40,
    fontSize: 16,
  },

  taskCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.GRAY_100,
  },
  taskCardSolved: {
    backgroundColor: "#f6fbf7",
    borderColor: "#cfe6d5",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taskHeaderBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.GRAY_900,
    flex: 1,
    marginRight: 8,
  },
  taskTitleSolved: {
    color: COLORS.GRAY_700,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  solvedBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#e8f5ec",
  },
  solvedBadgeText: {
    color: "#2f6b3f",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  taskTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  taskTag: {
    backgroundColor: "#FFF6DA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  taskTagText: {
    color: "#836400",
    fontSize: 11,
    fontWeight: "600",
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskMeta: { fontSize: 12, color: COLORS.GRAY_400 },
  xpBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#667eea",
  },
  xpBadgeText: { color: COLORS.WHITE, fontSize: 11, fontWeight: "700" },
  authorText: { fontSize: 11, color: COLORS.GRAY_400, marginTop: 6 },
});

export default CodingTasksList;
