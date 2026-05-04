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
import {s} from "./styles"
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
 
export default CodingTasksList;
