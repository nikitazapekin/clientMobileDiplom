import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";


import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LessonCommentsService, { type LessonComment } from "@/http/lessonComments";

interface LessonCommentsProps {
  visible: boolean;
  lessonDetailsId: string | null;
  onClose: () => void;
}

export const LessonComments: React.FC<LessonCommentsProps> = ({
  visible,
  lessonDetailsId,
  onClose
}) => {
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const commentsLoadedRef = useRef(false);

  useEffect(() => {
    void getClientId();
  }, []);

  const getClientId = async () => {
    try {
      const id = await AsyncStorage.getItem("clientId");
      setClientId(id);
    } catch (error) {
      console.error("Failed to get clientId:", error);
    }
  };

  const loadComments = useCallback(async (overrideLessonDetailsId?: string | null) => {
    const idToUse = overrideLessonDetailsId ?? lessonDetailsId;

    if (!idToUse) {
      console.log("⚠️ No lessonDetailsId available for loading comments");
      return;
    }

    console.log("📥 Loading comments for lessonDetailsId:", idToUse);
    setCommentsLoading(true);
    try {
      const data = await LessonCommentsService.getCommentsByLessonDetailsId(idToUse);
      console.log("📬 Comments API response:", JSON.stringify(data, null, 2));
      console.log("📬 Comments count:", data.comments?.length);
      console.log("📬 Comments data:", data.comments);
      console.log("📬 data.comments is array:", Array.isArray(data.comments));
      console.log("📬 data.total:", data.total);
      console.log("📬 data.canComment:", data.canComment);

      if (!data.comments || !Array.isArray(data.comments)) {
        console.error("❌ Comments is not an array:", data.comments);
        console.error("❌ Full data:", JSON.stringify(data));
        Alert.alert("Ошибка", "Неверный формат данных комментариев");
        setComments([]);
      } else {
        console.log("✅ Setting comments:", data.comments.length, "items");
        if (data.comments.length > 0) {
          Alert.alert("Комментарии", `Загружено комментариев: ${data.comments.length}    `);
        }
        setComments(data.comments);
      }
    } catch (error: any) {
      console.error("❌ Failed to load comments:", error.response?.data || error.message);
      console.error("❌ Full error:", JSON.stringify(error, null, 2));
      Alert.alert("Ошибка", "Не удалось загрузить комментарии: " + (error.response?.data?.message || error.message));
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [lessonDetailsId]);

  const handleSubmitComment = useCallback(async () => {
    const idToUse = lessonDetailsId;

    if (!newCommentText.trim() || !idToUse) {
      console.log("⚠️ Cannot submit comment: missing text or lessonDetailsId");
      return;
    }

    try {
      console.log("📤 Submitting comment to lessonDetailsId:", idToUse);
      await LessonCommentsService.createComment({
        lessonDetailsId: idToUse,
        content: newCommentText.trim(),
        parentId: replyingTo || null,
      });

      console.log("✅ Comment created, reloading comments...");
      setNewCommentText("");
      setReplyingTo(null);
      // Force a fresh reload by clearing comments first
      setComments([]);
      await loadComments(idToUse);
    } catch (error: any) {
      console.error("Failed to create comment:", error);
      Alert.alert("Ошибка", error.message || "Не удалось создать комментарий");
    }
  }, [newCommentText, lessonDetailsId, replyingTo, loadComments]);

  // Effect to load comments when modal is open and lessonDetailsId becomes available
  useEffect(() => {
    if (visible && lessonDetailsId && !commentsLoadedRef.current && !commentsLoading) {
      console.log("📥 Effect: Loading comments for lessonDetailsId:", lessonDetailsId);
      commentsLoadedRef.current = true;
      loadComments(lessonDetailsId);
    }
  }, [visible, lessonDetailsId, commentsLoading]);

  const handleToggleLike = useCallback(async (commentId: string) => {
    try {
      const updatedComment = await LessonCommentsService.toggleLike(commentId);
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, ...updatedComment } : c
      ));
    } catch (error: any) {
      console.error("Failed to toggle like:", error);
      Alert.alert("Ошибка", "Не удалось поставить лайк");
    }
  }, []);

  const handleToggleDislike = useCallback(async (commentId: string) => {
    try {
      const updatedComment = await LessonCommentsService.toggleDislike(commentId);
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, ...updatedComment } : c
      ));
    } catch (error: any) {
      console.error("Failed to toggle dislike:", error);
      Alert.alert("Ошибка", "Не удалось поставить дизлайк");
    }
  }, []);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    Alert.alert(
      "Удаление комментария",
      "Вы уверены, что хотите удалить комментарий?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await LessonCommentsService.deleteComment(commentId);
              await loadComments();
            } catch (error: any) {
              console.error("Failed to delete comment:", error);
              Alert.alert("Ошибка", "Не удалось удалить комментарий");
            }
          },
        },
      ]
    );
  }, [loadComments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.commentsModalContent, { height: 500 }]}>
          <View style={styles.commentsModalHeader}>
            <Text style={styles.commentsModalTitle}>Комментарии к уроку</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.commentsModalCloseButton}
            >
              <Text style={styles.commentsModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {commentsLoading ? (
            <View style={[styles.centerContent, { paddingVertical: 40 }]}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Загрузка комментариев...</Text>
            </View>
          ) : comments.length === 0 ? (
            <Text style={styles.noCommentsText}>
              Пока нет комментариев. Будьте первым!
            </Text>
          ) : (
            <ScrollView nestedScrollEnabled={true} style={{ flex: 1, maxHeight: 350 }}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      Пользователь {comment.userId.slice(0, 8)}
                    </Text>
                    <Text style={styles.commentDate}>
                      {formatDate(comment.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity
                      style={styles.commentAction}
                      onPress={() => handleToggleLike(comment.id)}
                    >
                      <Text style={comment.hasLiked ? styles.commentActionTextLiked : styles.commentActionText}>
                        👍 {comment.likes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.commentAction}
                      onPress={() => handleToggleDislike(comment.id)}
                    >
                      <Text style={comment.hasDisliked ? styles.commentActionTextLiked : styles.commentActionText}>
                        👎 {comment.dislikes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.commentAction}
                      onPress={() => setReplyingTo(comment.id)}
                    >
                      <Text style={styles.commentActionText}>Ответить</Text>
                    </TouchableOpacity>
                    {comment.userId === clientId && (
                      <TouchableOpacity
                        style={styles.commentAction}
                        onPress={() => handleDeleteComment(comment.id)}
                      >
                        <Text style={styles.commentActionText}>Удалить</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={[styles.replyContainer, { marginTop: 10, paddingLeft: 15 }]}>
                      {comment.replies.map((reply) => (
                        <View key={reply.id} style={[styles.commentItem, { marginTop: 8 }]}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentAuthor}>
                              Пользователь {reply.userId.slice(0, 8)}
                            </Text>
                            <Text style={styles.commentDate}>
                              {formatDate(reply.createdAt)}
                            </Text>
                          </View>
                          <Text style={styles.commentContent}>{reply.content}</Text>
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              style={styles.commentAction}
                              onPress={() => handleToggleLike(reply.id)}
                            >
                              <Text style={reply.hasLiked ? styles.commentActionTextLiked : styles.commentActionText}>
                                👍 {reply.likes}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.commentAction}
                              onPress={() => handleToggleDislike(reply.id)}
                            >
                              <Text style={reply.hasDisliked ? styles.commentActionTextLiked : styles.commentActionText}>
                                👎 {reply.dislikes}
                              </Text>
                            </TouchableOpacity>
                            {reply.userId === clientId && (
                              <TouchableOpacity
                                style={styles.commentAction}
                                onPress={() => handleDeleteComment(reply.id)}
                              >
                                <Text style={styles.commentActionText}>Удалить</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.commentInputContainer}>
            {replyingTo && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Ответ на комментарий
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Text style={{ fontSize: 14, color: '#999' }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              style={styles.commentInput}
              multiline
              placeholder={replyingTo ? "Введите ваш ответ..." : "Введите ваш комментарий..."}
              value={newCommentText}
              onChangeText={setNewCommentText}
            />
            <TouchableOpacity
              style={styles.commentSubmitButton}
              onPress={handleSubmitComment}
              disabled={!newCommentText.trim()}
            >
              <Text style={styles.commentSubmitButtonText}>
                {replyingTo ? "Отправить ответ" : "Отправить комментарий"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

 
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  commentsModalContent: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    padding: 20,
    flexDirection: 'column',
  },
  commentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  commentsModalCloseButton: {
    padding: 5,
  },
  commentsModalCloseText: {
    fontSize: 20,
    color: COLORS.GRAY_LIGHT,
  },
  commentItem: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 15,
    color: COLORS.BLACK,
    lineHeight: 22,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  commentActionText: {
    fontSize: 13,
    color: '#666',
  },
  commentActionTextLiked: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    padding: 30,
  },
  commentInputContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    height: 120,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  commentSubmitButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.BLACK,
    alignItems: 'center',
  },
  commentSubmitButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.GRAY_LIGHT,
  },
});
