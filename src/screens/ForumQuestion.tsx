import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RouteProp} from "@react-navigation/native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONTS } from "appStyles";

import CommunityThread from "@/components/CommunityThread";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import AuthService from "@/http/auth";
import forumService from "@/http/forum";
import type { CommunityComment, ForumQuestionStatus } from "@/http/types/community";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp, RootStackParamList } from "@/navigation/types";

type ForumQuestionRoute = RouteProp<
  RootStackParamList,
  typeof ROUTES.STACK.FORUM_QUESTION
>;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ForumQuestionScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<ForumQuestionRoute>();
  const { questionId } = route.params;
  const [question, setQuestion] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [editingComment, setEditingComment] = useState<CommunityComment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async (isRefresh = false) => {
    try {
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [user, response] = await Promise.all([
        AuthService.getCurrentUser(),
        forumService.getQuestionById(questionId),
      ]);

      setCurrentUserId(user?.userId || null);
      setQuestion(response);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить вопрос");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [questionId]);

  useFocusEffect(
    useCallback(() => {
      void loadQuestion();
    }, [loadQuestion]),
  );

  const resetComposer = () => {
    setComposerText("");
    setReplyTo(null);
    setEditingComment(null);
  };

  const submitComment = async () => {
    if (!composerText.trim()) {
      return;
    }

    try {
      setActionLoading(true);

      if (editingComment) {
        await forumService.updateComment(editingComment.id, {
          content: composerText.trim(),
        });
      } else {
        await forumService.createComment(questionId, {
          content: composerText.trim(),
          parentId: replyTo?.id ?? null,
        });
      }

      resetComposer();
      await loadQuestion();
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось отправить ответ");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!question) {
      return;
    }

    const nextStatus: ForumQuestionStatus =
      question.status === "open" ? "closed" : "open";

    try {
      setActionLoading(true);
      await forumService.updateQuestionStatus(question.id, nextStatus);
      await loadQuestion();
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось поменять статус");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteQuestion = () => {
    if (!question) {
      return;
    }

    Alert.alert("Удалить вопрос?", "Ответы тоже будут удалены.", [
      { style: "cancel", text: "Отмена" },
      {
        style: "destructive",
        text: "Удалить",
        onPress: async () => {
          try {
            setActionLoading(true);
            await forumService.deleteQuestion(question.id);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert("Ошибка", err.message || "Не удалось удалить вопрос");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const deleteComment = (comment: CommunityComment) => {
    Alert.alert("Удалить ответ?", "Вложенные ответы тоже будут удалены.", [
      { style: "cancel", text: "Отмена" },
      {
        style: "destructive",
        text: "Удалить",
        onPress: async () => {
          try {
            await forumService.deleteComment(comment.id);
            await loadQuestion();
          } catch (err: any) {
            Alert.alert("Ошибка", err.message || "Не удалось удалить ответ");
          }
        },
      },
    ]);
  };

  const handleEditComment = (comment: CommunityComment) => {
    setEditingComment(comment);
    setReplyTo(null);
    setComposerText(comment.content);
  };

  const handleReplyComment = (comment: CommunityComment) => {
    setReplyTo(comment);
    setEditingComment(null);
    setComposerText("");
  };

  const canManageQuestion = Boolean(question && currentUserId === question.authorId);

  return (
    <View style={styles.screen}>
      <Header title="Вопрос" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              colors={[COLORS.PRIMARY]}
              onRefresh={() => void loadQuestion(true)}
              refreshing={refreshing}
            />
          }
        >
          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={COLORS.PRIMARY} size="large" />
            </View>
          ) : error || !question ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{error || "Вопрос не найден"}</Text>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => void loadQuestion()}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineButtonText}>Обновить</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.questionCard}>
                <View style={styles.questionHead}>
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

                  <Text style={styles.dateText}>{formatDate(question.createdAt)}</Text>
                </View>

                <Text style={styles.title}>{question.title}</Text>
                <Text style={styles.bodyText}>{question.content}</Text>

                <View style={styles.tagsWrap}>
                  {question.tags.map((item: string) => (
                    <View key={item} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.authorText}>{question.authorName}</Text>
                  <Text style={styles.metaText}>{question.commentsCount} ответов</Text>
                </View>

                {canManageQuestion ? (
                  <View style={styles.manageRow}>
                    <TouchableOpacity
                      activeOpacity={0.84}
                      onPress={() =>
                        navigation.navigate(ROUTES.STACK.FORUM_EDITOR, {
                          questionId: question.id,
                        })
                      }
                      style={styles.outlineButton}
                    >
                      <Text style={styles.outlineButtonText}>Редактировать</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.84}
                      onPress={toggleStatus}
                      style={styles.successButton}
                    >
                      <Text style={styles.successButtonText}>
                        {question.status === "open" ? "Отметить решённым" : "Переоткрыть"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.84}
                      onPress={deleteQuestion}
                      style={styles.dangerButton}
                    >
                      <Text style={styles.dangerButtonText}>Удалить</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ответы</Text>
                {actionLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
              </View>

              <CommunityThread
                comments={question.comments || []}
                currentUserId={currentUserId}
                emptyText="Пока никто не ответил на вопрос."
                onDelete={deleteComment}
                onDislike={async (commentId) => {
                  try {
                    await forumService.toggleCommentDislike(commentId);
                    await loadQuestion();
                  } catch (err: any) {
                    Alert.alert("Ошибка", err.message || "Не удалось поставить дизлайк");
                  }
                }}
                onEdit={handleEditComment}
                onLike={async (commentId) => {
                  try {
                    await forumService.toggleCommentLike(commentId);
                    await loadQuestion();
                  } catch (err: any) {
                    Alert.alert("Ошибка", err.message || "Не удалось поставить лайк");
                  }
                }}
                onReply={handleReplyComment}
              />

              <View style={styles.composerCard}>
                <Text style={styles.composerTitle}>
                  {editingComment
                    ? "Редактирование ответа"
                    : replyTo
                      ? `Ответ для ${replyTo.authorName}`
                      : "Новый ответ"}
                </Text>

                {(replyTo || editingComment) ? (
                  <TouchableOpacity activeOpacity={0.82} onPress={resetComposer}>
                    <Text style={styles.cancelLink}>Сбросить режим</Text>
                  </TouchableOpacity>
                ) : null}

                <TextInput
                  multiline={true}
                  onChangeText={setComposerText}
                  placeholder="Напиши ответ, идею решения или уточняющий вопрос"
                  placeholderTextColor={COLORS.GRAY_400}
                  style={styles.textArea}
                  value={composerText}
                />

                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={!composerText.trim() || actionLoading}
                  onPress={() => void submitComment()}
                  style={[
                    styles.submitButton,
                    (!composerText.trim() || actionLoading) && styles.submitButtonDisabled,
                  ]}
                >
                  <Text style={styles.submitButtonText}>
                    {editingComment ? "Сохранить ответ" : "Отправить ответ"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Footer activeTab="courses" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F3F6ED",
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
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
  questionCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
  },
  questionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  dateText: {
    color: COLORS.GRAY_500,
    fontSize: 12,
  },
  title: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.LG,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: 14,
  },
  bodyText: {
    color: COLORS.GRAY_800,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 24,
    marginTop: 12,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
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
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
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
  manageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  outlineButton: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  outlineButtonText: {
    color: COLORS.GRAY_700,
    fontSize: 13,
    fontWeight: "700",
  },
  successButton: {
    backgroundColor: "#EAF7E1",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  successButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: "800",
  },
  dangerButton: {
    backgroundColor: "#FCEEEE",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dangerButtonText: {
    color: COLORS.ERROR,
    fontSize: 13,
    fontWeight: "800",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "800",
  },
  composerCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginTop: 18,
    padding: 16,
  },
  composerTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "800",
  },
  cancelLink: {
    color: COLORS.ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
  textArea: {
    backgroundColor: COLORS.GRAY_50,
    borderColor: COLORS.GRAY_200,
    borderRadius: 16,
    borderWidth: 1,
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.SM,
    minHeight: 130,
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlignVertical: "top",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "800",
  },
});
