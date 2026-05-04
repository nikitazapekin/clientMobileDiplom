

import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "appStyles";
export const styles = StyleSheet.create({
  course: {
    backgroundColor: COLORS.WHITE,
    borderColor: "#EAEAEA",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  mediaColumn: {
    width: 92,
  },
  courseImage: {
    borderRadius: 18,
    height: 92,
    width: 92,
  },
  courseImagePlaceholder: {
    alignItems: "center",
    backgroundColor: COLORS.GRAY_100,
    justifyContent: "center",
  },
  courseImagePlaceholderText: {
    color: COLORS.GRAY_500,
    fontSize: 22,
    fontWeight: "700",
  },
  contentColumn: {
    flex: 1,
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  courseTitle: {
    color: COLORS.GRAY_900,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  statusBadge: {
    backgroundColor: "#F3F3F3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: COLORS.GRAY_600,
    fontSize: 11,
    fontWeight: "600",
  },
  courseDescription: {
    color: COLORS.GRAY_600,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  metaChip: {
    backgroundColor: "#FAFAFA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    color: COLORS.GRAY_700,
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 10,
  },
  statsText: {
    color: COLORS.GRAY_500,
    fontSize: 12,
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#FFF6DA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: "#836400",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  bottomMetaText: {
    color: COLORS.GRAY_500,
    fontSize: 12,
    fontWeight: "500",
  },
  bottomActionText: {
    color: COLORS.ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
});
