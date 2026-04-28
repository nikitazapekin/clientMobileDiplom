import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS, SIZES } from "appStyles";

import type { CommunityComment } from "@/http/types/community";

interface CommunityThreadProps {
  comments: CommunityComment[];
  currentUserId?: string | null;
  emptyText?: string;
  onReply: (comment: CommunityComment) => void;
  onEdit: (comment: CommunityComment) => void;
  onDelete: (comment: CommunityComment) => void;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function CommentNode({
  comment,
  currentUserId,
  depth,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onDislike,
}: {
  comment: CommunityComment;
  currentUserId?: string | null;
  depth: number;
  onReply: (comment: CommunityComment) => void;
  onEdit: (comment: CommunityComment) => void;
  onDelete: (comment: CommunityComment) => void;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
}) {
  const isOwn = currentUserId === comment.authorId;

  return (
    <View style={[styles.commentCard, depth > 0 && styles.replyCard, { marginLeft: depth * 14 }]}>
      <View style={styles.commentHeader}>
        <View style={styles.authorBadge}>
          <Text style={styles.authorInitial}>
            {(comment.authorName || "?").trim().charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.commentMeta}>
          <Text style={styles.authorName}>{comment.authorName}</Text>
          <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.commentText}>{comment.content}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => onLike(comment.id)}
          style={[styles.reactionButton, comment.hasLiked && styles.reactionButtonActive]}
        >
          <Text style={[styles.reactionButtonText, comment.hasLiked && styles.reactionButtonTextActive]}>
            Лайк {comment.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => onDislike(comment.id)}
          style={[styles.reactionButton, comment.hasDisliked && styles.reactionButtonDanger]}
        >
          <Text
            style={[
              styles.reactionButtonText,
              comment.hasDisliked && styles.reactionButtonDangerText,
            ]}
          >
            Дизлайк {comment.dislikes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.82} onPress={() => onReply(comment)} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Ответить</Text>
        </TouchableOpacity>

        {isOwn ? (
          <>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => onEdit(comment)}
              style={styles.linkButton}
            >
              <Text style={styles.linkButtonText}>Изменить</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => onDelete(comment)}
              style={styles.linkButton}
            >
              <Text style={[styles.linkButtonText, styles.dangerText]}>Удалить</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {comment.replies.length > 0 ? (
        <View style={styles.repliesWrap}>
          {comment.replies.map((reply) => (
            <CommentNode
              comment={reply}
              currentUserId={currentUserId}
              depth={depth + 1}
              key={reply.id}
              onDelete={onDelete}
              onDislike={onDislike}
              onEdit={onEdit}
              onLike={onLike}
              onReply={onReply}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function CommunityThread({
  comments,
  currentUserId,
  emptyText = "Пока нет комментариев.",
  onReply,
  onEdit,
  onDelete,
  onLike,
  onDislike,
}: CommunityThreadProps) {
  if (!comments.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.thread}>
      {comments.map((comment) => (
        <CommentNode
          comment={comment}
          currentUserId={currentUserId}
          depth={0}
          key={comment.id}
          onDelete={onDelete}
          onDislike={onDislike}
          onEdit={onEdit}
          onLike={onLike}
          onReply={onReply}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  thread: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  emptyStateText: {
    color: COLORS.GRAY_500,
    fontSize: FONTS.SIZE.SM,
    textAlign: "center",
  },
  commentCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  replyCard: {
    backgroundColor: "#FBFCF8",
  },
  commentHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  authorBadge: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIES_CIRCLE,
    height: 36,
    justifyContent: "center",
    marginRight: 10,
    width: 36,
  },
  authorInitial: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: "700",
  },
  commentMeta: {
    flex: 1,
  },
  authorName: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.SM,
    fontWeight: "700",
  },
  commentDate: {
    color: COLORS.GRAY_500,
    fontSize: 12,
    marginTop: 2,
  },
  commentText: {
    color: COLORS.GRAY_800,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  reactionButton: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontWeight: "600",
  },
  reactionButtonTextActive: {
    color: COLORS.PRIMARY,
  },
  reactionButtonDangerText: {
    color: COLORS.ERROR,
  },
  linkButton: {
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  linkButtonText: {
    color: COLORS.ACCENT,
    fontSize: 13,
    fontWeight: "600",
  },
  dangerText: {
    color: COLORS.ERROR,
  },
  repliesWrap: {
    gap: 10,
    marginTop: 12,
  },
});
