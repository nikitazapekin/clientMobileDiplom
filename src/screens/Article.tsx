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

import ArticleContentRenderer from "@/components/ArticleContentRenderer";
import CommunityThread from "@/components/CommunityThread";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import articlesService from "@/http/articles";
import AuthService from "@/http/auth";
import type { CommunityComment } from "@/http/types/community";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp, RootStackParamList } from "@/navigation/types";

type ArticleRoute = RouteProp<RootStackParamList, typeof ROUTES.STACK.ARTICLE>;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ArticleScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<ArticleRoute>();
  const { articleId } = route.params;
  const [article, setArticle] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [editingComment, setEditingComment] = useState<CommunityComment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadArticle = useCallback(async (isRefresh = false) => {
    try {
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [user, response] = await Promise.all([
        AuthService.getCurrentUser(),
        articlesService.getArticleById(articleId),
      ]);

      setCurrentUserId(user?.userId || null);
      setArticle(response);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить статью");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [articleId]);

  useFocusEffect(
    useCallback(() => {
      void loadArticle();
    }, [loadArticle]),
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
        await articlesService.updateComment(editingComment.id, {
          content: composerText.trim(),
        });
      } else {
        await articlesService.createComment(articleId, {
          content: composerText.trim(),
          parentId: replyTo?.id ?? null,
        });
      }

      resetComposer();
      await loadArticle();
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось отправить комментарий");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteArticle = () => {
    if (!article) {
      return;
    }

    Alert.alert("Удалить статью?", "Комментарии тоже будут удалены.", [
      { style: "cancel", text: "Отмена" },
      {
        style: "destructive",
        text: "Удалить",
        onPress: async () => {
          try {
            setActionLoading(true);
            await articlesService.deleteArticle(article.id);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert("Ошибка", err.message || "Не удалось удалить статью");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const deleteComment = (comment: CommunityComment) => {
    Alert.alert("Удалить комментарий?", "Вложенные ответы тоже будут удалены.", [
      { style: "cancel", text: "Отмена" },
      {
        style: "destructive",
        text: "Удалить",
        onPress: async () => {
          try {
            await articlesService.deleteComment(comment.id);
            await loadArticle();
          } catch (err: any) {
            Alert.alert("Ошибка", err.message || "Не удалось удалить комментарий");
          }
        },
      },
    ]);
  };

  const canManageArticle = Boolean(article && currentUserId === article.authorId);

  return (
    <View style={styles.screen}>
      <Header title="Статья" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              colors={[COLORS.PRIMARY]}
              onRefresh={() => void loadArticle(true)}
              refreshing={refreshing}
            />
          }
        >
          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={COLORS.PRIMARY} size="large" />
            </View>
          ) : error || !article ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{error || "Статья не найдена"}</Text>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => void loadArticle()}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineButtonText}>Обновить</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.articleCard}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.dateText}>{formatDate(article.createdAt)}</Text>

                <View style={styles.tagsWrap}>
                  {article.tags.map((item: string) => (
                    <View key={item} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.statsRow}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={async () => {
                      try {
                        await articlesService.toggleLike(article.id);
                        await loadArticle();
                      } catch (err: any) {
                        Alert.alert("Ошибка", err.message || "Не удалось поставить лайк");
                      }
                    }}
                    style={[styles.reactionButton, article.hasLiked && styles.reactionButtonActive]}
                  >
                    <Text
                      style={[
                        styles.reactionButtonText,
                        article.hasLiked && styles.reactionButtonTextActive,
                      ]}
                    >
                      Лайк {article.likes}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={async () => {
                      try {
                        await articlesService.toggleDislike(article.id);
                        await loadArticle();
                      } catch (err: any) {
                        Alert.alert("Ошибка", err.message || "Не удалось поставить дизлайк");
                      }
                    }}
                    style={[
                      styles.reactionButton,
                      article.hasDisliked && styles.reactionButtonDanger,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reactionButtonText,
                        article.hasDisliked && styles.reactionButtonDangerText,
                      ]}
                    >
                      Дизлайк {article.dislikes}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.authorText}>{article.authorName}</Text>
                </View>

                {canManageArticle ? (
                  <View style={styles.manageRow}>
                    <TouchableOpacity
                      activeOpacity={0.84}
                      onPress={() =>
                        navigation.navigate(ROUTES.STACK.ARTICLE_EDITOR, {
                          articleId: article.id,
                        })
                      }
                      style={styles.outlineButton}
                    >
                      <Text style={styles.outlineButtonText}>Редактировать</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.84}
                      onPress={deleteArticle}
                      style={styles.dangerButton}
                    >
                      <Text style={styles.dangerButtonText}>Удалить</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <View style={styles.contentCard}>
                <Text style={styles.sectionTitle}>Содержимое</Text>
                <ArticleContentRenderer blocks={article.contentBlocks || []} />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Обсуждение</Text>
                {actionLoading ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
              </View>

              <CommunityThread
                comments={article.comments || []}
                currentUserId={currentUserId}
                emptyText="Пока нет комментариев к статье."
                onDelete={deleteComment}
                onDislike={async (commentId) => {
                  try {
                    await articlesService.toggleCommentDislike(commentId);
                    await loadArticle();
                  } catch (err: any) {
                    Alert.alert("Ошибка", err.message || "Не удалось поставить дизлайк");
                  }
                }}
                onEdit={(comment) => {
                  setEditingComment(comment);
                  setReplyTo(null);
                  setComposerText(comment.content);
                }}
                onLike={async (commentId) => {
                  try {
                    await articlesService.toggleCommentLike(commentId);
                    await loadArticle();
                  } catch (err: any) {
                    Alert.alert("Ошибка", err.message || "Не удалось поставить лайк");
                  }
                }}
                onReply={(comment) => {
                  setReplyTo(comment);
                  setEditingComment(null);
                  setComposerText("");
                }}
              />

              <View style={styles.composerCard}>
                <Text style={styles.composerTitle}>
                  {editingComment
                    ? "Редактирование комментария"
                    : replyTo
                      ? `Ответ для ${replyTo.authorName}`
                      : "Новый комментарий"}
                </Text>

                {(replyTo || editingComment) ? (
                  <TouchableOpacity activeOpacity={0.82} onPress={resetComposer}>
                    <Text style={styles.cancelLink}>Сбросить режим</Text>
                  </TouchableOpacity>
                ) : null}

                <TextInput
                  multiline={true}
                  onChangeText={setComposerText}
                  placeholder="Добавь мысль, уточнение или обратную связь по статье"
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
                    {editingComment ? "Сохранить комментарий" : "Отправить комментарий"}
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
    backgroundColor: "#F4F6F1",
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
  articleCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  articleTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.LG,
    fontWeight: "800",
    lineHeight: 32,
  },
  dateText: {
    color: COLORS.GRAY_500,
    fontSize: 12,
    marginTop: 10,
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
  statsRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  reactionButton: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reactionButtonActive: {
    backgroundColor: "#EAF7E1",
  },
  reactionButtonDanger: {
    backgroundColor: "#FCEEEE",
  },
  reactionButtonText: {
    color: COLORS.GRAY_700,
    fontSize: 13,
    fontWeight: "700",
  },
  reactionButtonTextActive: {
    color: COLORS.PRIMARY,
  },
  reactionButtonDangerText: {
    color: COLORS.ERROR,
  },
  authorText: {
    color: COLORS.GRAY_DARK,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: "auto",
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
  contentCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
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
    marginBottom: 12,
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
