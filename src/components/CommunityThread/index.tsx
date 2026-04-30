import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, FONTS } from "appStyles";

import type { CommunityComment } from "@/http/types/community";

const BRAND_COLOR = "#9F0FA7";
const THUMB_ICON = require("../../../assets/dislike.png");

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

  const renderVoteAction = (
    count: number,
    active: boolean,
    onPress: () => void,
    rotated = false,
  ) => (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.commentAction}>
      <Image
        source={THUMB_ICON}
        style={[styles.commentActionIcon, rotated && styles.commentActionIconRotated]}
        resizeMode="contain"
      />
      <Text style={active ? styles.commentActionTextActive : styles.commentActionText}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={depth > 0 ? styles.replyContainer : undefined}>
      <View style={[styles.commentCard, depth > 0 && styles.replyCard]}>
      <View style={styles.commentHeader}>
        <Text style={styles.authorName}>{comment.authorName}</Text>
        <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
      </View>

      <Text style={styles.commentText}>{comment.content}</Text>

      <View style={styles.actionsRow}>
        {renderVoteAction(comment.likes, comment.hasLiked, () => onLike(comment.id), true)}
        {renderVoteAction(comment.dislikes, comment.hasDisliked, () => onDislike(comment.id))}

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
    backgroundColor: "#F9F9F9",
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  replyCard: {
    marginTop: 8,
  },
  commentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  authorName: {
    color: COLORS.BLACK,
    fontSize: 14,
    fontWeight: "600",
  },
  commentDate: {
    color: "#999",
    fontSize: 12,
  },
  commentText: {
    color: COLORS.BLACK,
    fontSize: 15,
    lineHeight: 22,
  },
  actionsRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 10,
  },
  commentAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  commentActionIcon: {
    height: 20,
    width: 20,
  },
  commentActionIconRotated: {
    transform: [{ rotate: "180deg" }],
  },
  commentActionText: {
    color: "#666",
    fontSize: 13,
  },
  commentActionTextActive: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    flexDirection: "row",
  },
  linkButtonText: {
    color: "#666",
    fontSize: 13,
  },
  replyContainer: {
    borderLeftColor: COLORS.GRAY_LIGHT,
    borderLeftWidth: 2,
    marginTop: 10,
    paddingLeft: 15,
  },
  dangerText: {
    color: COLORS.ERROR,
  },
  repliesWrap: {
    marginTop: 2,
  },
});
