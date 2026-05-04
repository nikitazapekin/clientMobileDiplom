

import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "appStyles";
const BRAND_COLOR = "#9F0FA7";
export const styles = StyleSheet.create({
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
