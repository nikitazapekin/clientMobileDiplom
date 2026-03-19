import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { COLORS, SIZES } from "appStyles";
import CodeEditor from "@/components/CodeEditor";
import { CodeService } from "@/http/codeService";
import type { CodeLanguage } from "@/http/codeService";
import {
  CodingTasksService,
  type CodeTask,
  type SubmitSolutionResult,
} from "@/http/codingTasksService";

interface Props {
  id: string;
}

const DIFF_COLORS: Record<string, string> = {
  easy: "#4caf50",
  medium: "#ff9800",
  hard: "#f44336",
};

const DIFF_LABELS: Record<string, string> = {
  easy: "Легкий",
  medium: "Средний",
  hard: "Сложный",
};

const LANG_LABELS: Record<string, string> = {
  javascript: "JS",
  python: "Python",
  csharp: "C#",
  java: "Java",
  golang: "Go",
  cpp: "C++",
};

const CodingTaskSolver = ({ id }: Props) => {
  const [task, setTask] = useState<CodeTask | null>(null);
  const [selectedLang, setSelectedLang] = useState<CodeLanguage>("javascript");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [result, setResult] = useState<SubmitSolutionResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const loadTask = useCallback(async () => {
    try {
      const data = await CodingTasksService.getTask(id);
      setTask(data);
      const firstLang = (data.languages?.[0] || "javascript") as CodeLanguage;
      setSelectedLang(firstLang);
      setCode(data.startCodes?.[firstLang] || "");
    } catch (e) {
      console.error("Failed to load task:", e);
      Alert.alert("Ошибка", "Не удалось загрузить задачу");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleLangChange = (lang: CodeLanguage) => {
    setSelectedLang(lang);
    setCode(task?.startCodes?.[lang] || "");
    setConsoleOutput("");
    setResult(null);
  };

  const handleRun = async () => {
    if (!task) return;
    setRunLoading(true);
    setConsoleOutput("");
    try {
      const res = await CodeService.executeCode({ language: selectedLang, code });
      setConsoleOutput(res.error || res.output || "Нет вывода");
    } catch {
      setConsoleOutput("Ошибка выполнения");
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!task) return;
    setSubmitLoading(true);
    setResult(null);
    try {
      const res = await CodingTasksService.submitSolution(task.id, code, selectedLang);
      setResult(res);
      setShowResult(true);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.message || "Не удалось отправить решение");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !task) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  const diffColor = DIFF_COLORS[task.difficulty] || DIFF_COLORS.easy;
  const diffLabel = DIFF_LABELS[task.difficulty] || task.difficulty;
  const passedCount = result?.results?.filter((r) => r.passed).length ?? 0;
  const totalCount = result?.results?.length ?? 0;

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      <View style={st.taskHeader}>
        <Text style={st.taskTitle}>{task.title}</Text>
        <View style={st.metaRow}>
          <View style={[st.badge, { backgroundColor: diffColor }]}>
            <Text style={st.badgeText}>{diffLabel}</Text>
          </View>
          <View style={st.xpBadge}>
            <Text style={st.xpBadgeText}>+{task.experienceReward} XP</Text>
          </View>
        </View>
      </View>

      <View style={st.descriptionCard}>
        <Text style={st.descTitle}>Описание</Text>
        <Text style={st.descText}>{task.description}</Text>
      </View>

      {task.constraints && task.constraints.length > 0 && (
        <View style={st.constraintsCard}>
          <Text style={st.constraintsTitle}>Ограничения</Text>
          {task.constraints.map((c, i) => (
            <Text key={i} style={st.constraintItem}>
              {c.type === "maxTimeMs" && `Время: ${c.value}мс`}
              {c.type === "maxLines" && `Макс. строк: ${c.value}`}
              {c.type === "forbiddenTokens" && `Запрещено: ${(c.value as string[]).join(", ")}`}
              {c.type === "noComments" && "Без комментариев"}
              {c.type === "noConsoleLog" && "Без console.log"}
              {c.type === "maxComplexity" && `Макс. сложность: ${c.value}`}
              {c.type === "memoryLimit" && `Память: ${c.value} МБ`}
              {c.type === "requiredKeywords" && `Обязательно: ${(c.value as string[]).join(", ")}`}
            </Text>
          ))}
        </View>
      )}

      <View style={st.langSection}>
        <Text style={st.langSectionLabel}>Язык решения</Text>
        <View style={st.langRow}>
          {(task.languages || []).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[st.langBtn, selectedLang === lang && st.langBtnActive]}
              onPress={() => handleLangChange(lang as CodeLanguage)}
            >
              <Text style={[st.langBtnText, selectedLang === lang && st.langBtnTextActive]}>
                {LANG_LABELS[lang] || lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={st.editorSection}>
        <Text style={st.editorLabel}>Ваше решение</Text>
        <View style={st.editorWrap}>
          <CodeEditor
            key={selectedLang}
            value={code}
            onChange={setCode}
            language={selectedLang}
            height={300}
            onRun={handleRun}
            runLoading={runLoading}
          />
        </View>
      </View>

      <View style={st.actions}>
        <TouchableOpacity
          style={[st.actionBtn, st.runBtn]}
          onPress={handleRun}
          disabled={runLoading}
        >
          {runLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={st.actionBtnText}>▶ Запустить</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.actionBtn, st.submitBtn]}
          onPress={handleSubmit}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={st.actionBtnText}>Проверить решение</Text>
          )}
        </TouchableOpacity>
      </View>

      {consoleOutput !== "" && (
        <View style={st.consoleCard}>
          <Text style={st.consoleTitle}>Консоль</Text>
          <Text style={st.consoleText}>{consoleOutput}</Text>
        </View>
      )}

      {result && !showResult && (
        <TouchableOpacity onPress={() => setShowResult(true)}>
          <Text style={st.showResultLink}>Показать результаты</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showResult} transparent animationType="slide">
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>
                {result?.allPassed ? "Все тесты пройдены!" : "Есть ошибки"}
              </Text>
              <TouchableOpacity onPress={() => setShowResult(false)}>
                <Text style={st.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {result && (
              <>
                <View style={st.summary}>
                  <View style={st.summaryItem}>
                    <Text style={st.summaryLabel}>Пройдено</Text>
                    <Text
                      style={[
                        st.summaryValue,
                        { color: result.allPassed ? "#4caf50" : "#f44336" },
                      ]}
                    >
                      {passedCount}/{totalCount}
                    </Text>
                  </View>
                  {result.experienceGained > 0 && (
                    <View style={st.summaryItem}>
                      <Text style={st.summaryLabel}>Получено XP</Text>
                      <Text style={[st.summaryValue, { color: COLORS.ACCENT }]}>
                        +{result.experienceGained}
                      </Text>
                    </View>
                  )}
                  <View style={st.summaryItem}>
                    <Text style={st.summaryLabel}>Уровень</Text>
                    <Text style={st.summaryValue}>{result.newLevel}</Text>
                  </View>
                </View>

                <ScrollView style={st.resultsList}>
                  {result.results.map((r) => (
                    <View
                      key={r.index}
                      style={[
                        st.resultItem,
                        { borderLeftColor: r.passed ? "#4caf50" : "#f44336" },
                      ]}
                    >
                      <View style={st.resultHeader}>
                        <Text style={st.resultIndex}>Тест #{r.index + 1}</Text>
                        <Text style={{ color: r.passed ? "#4caf50" : "#f44336", fontWeight: "600" }}>
                          {r.passed ? "Пройден" : "Провален"}
                        </Text>
                      </View>
                      <Text style={st.resultDetail}>Вход: {r.input}</Text>
                      <Text style={st.resultDetail}>Ожидалось: {r.expected}</Text>
                      <Text style={st.resultDetail}>Получено: {r.actual}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={st.modalCloseBtn}
              onPress={() => setShowResult(false)}
            >
              <Text style={st.modalCloseBtnText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.GRAY_50 },
  content: { padding: SIZES.SPACING_MD, paddingBottom: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  taskHeader: { marginBottom: SIZES.SPACING_MD },
  taskTitle: { fontSize: 22, fontWeight: "700", color: COLORS.GRAY_900, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  xpBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, backgroundColor: "#667eea" },
  xpBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  descriptionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  descTitle: { fontSize: 15, fontWeight: "600", color: COLORS.GRAY_800, marginBottom: 6 },
  descText: { fontSize: 14, color: COLORS.GRAY_600, lineHeight: 20 },

  constraintsCard: {
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: SIZES.SPACING_MD,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  constraintsTitle: { fontSize: 14, fontWeight: "600", color: "#e65100", marginBottom: 6 },
  constraintItem: { fontSize: 13, color: COLORS.GRAY_700, marginBottom: 4 },

  langSection: { marginBottom: 12 },
  langSectionLabel: { fontSize: 14, fontWeight: "600", color: COLORS.GRAY_700, marginBottom: 8 },
  langRow: { flexDirection: "row", gap: 0, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: COLORS.GRAY_200 },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRightWidth: 1,
    borderRightColor: COLORS.GRAY_200,
  },
  langBtnActive: { backgroundColor: COLORS.ACCENT },
  langBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.GRAY_600 },
  langBtnTextActive: { color: COLORS.WHITE },

  editorSection: { marginBottom: 12 },
  editorLabel: { fontSize: 14, fontWeight: "600", color: COLORS.GRAY_700, marginBottom: 6 },
  editorWrap: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: COLORS.GRAY_200 },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  runBtn: { backgroundColor: COLORS.GRAY_700 },
  submitBtn: { backgroundColor: COLORS.ACCENT },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  consoleCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  consoleTitle: { color: "#aaa", fontSize: 12, marginBottom: 6, fontWeight: "600" },
  consoleText: { color: "#d4d4d4", fontSize: 13, fontFamily: "monospace" },

  showResultLink: {
    color: COLORS.ACCENT,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SIZES.SPACING_LG,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.GRAY_900 },
  modalClose: { fontSize: 20, color: COLORS.GRAY_400, padding: 4 },

  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.GRAY_50,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryLabel: { fontSize: 12, color: COLORS.GRAY_500 },
  summaryValue: { fontSize: 20, fontWeight: "700", color: COLORS.GRAY_900 },

  resultsList: { maxHeight: 300 },
  resultItem: {
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_50,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  resultIndex: { fontSize: 13, fontWeight: "600", color: COLORS.GRAY_800 },
  resultDetail: { fontSize: 12, color: COLORS.GRAY_600, marginBottom: 2 },

  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCloseBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});

export default CodingTaskSolver;
