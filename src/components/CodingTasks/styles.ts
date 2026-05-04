
import { COLORS, FONTS, SIZES } from "appStyles";
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";


export  const s = StyleSheet.create({
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
