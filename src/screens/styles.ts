import { StyleSheet } from "react-native";
import { COLORS, FONTS,SIZES } from "appStyles";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_DARK,
  },

  containerLight: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  containerWhite: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },

  content: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,

  },

  contentContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 2,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,

    color: COLORS.WHITE,
  },

  achievementsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  achievementCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_MEDIUM,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  achievementImage: {
    width: 64,
    height: 64,
    borderRadius: SIZES.RADIUS_MEDIUM,
    marginRight: 16,
    backgroundColor: COLORS.GRAY_100,
  },
  achievementContent: {
    flex: 1,
  },
  achievementImageFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  achievementFallbackIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: "bold",
    color: COLORS.GRAY_DARK,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_600,
    marginBottom: 8,
  },
  achievementTier: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    textTransform: "uppercase",
  },
  achievementDate: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
    marginTop: 4,
  },
  noAchievementsContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  noAchievementsText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.GRAY_600,
    textAlign: "center",
    marginTop: 16,
  },
  noAchievementsIcon: {
    fontSize: 52,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.ERROR,
    textAlign: "center",
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 64,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS_MEDIUM,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "600",
  },
  statusText: {
    marginTop: 16,
    color: COLORS.GRAY_600,
  },
  progressSection: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_MEDIUM,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: "bold",
    color: COLORS.GRAY_DARK,
    marginBottom: 12,
  },
  sectionCaption: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_600,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_600,
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
    marginTop: 4,
    textAlign: "right",
  },
  sectionBlock: {
    marginTop: 8,
  },
  listSectionTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: "bold",
    color: COLORS.GRAY_DARK,
    marginBottom: 12,
  },
  myRankCard: {
    backgroundColor: "#f6fbef",
    borderColor: COLORS.PRIMARY,
    borderWidth: 1,
    borderRadius: SIZES.RADIUS_MEDIUM,
    padding: 16,
    marginBottom: 16,
  },
  myRankLabel: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    textTransform: "uppercase",
  },
  myRankName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: "700",
    color: COLORS.GRAY_DARK,
    marginTop: 8,
  },
  myRankMeta: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_600,
    marginTop: 4,
  },
  myRankStatsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  myRankStat: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS_MEDIUM,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  myRankStatValue: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: "700",
    color: COLORS.GRAY_DARK,
  },
  myRankStatLabel: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
    marginTop: 4,
  },
  leaderboardList: {
    gap: 10,
  },
  leaderboardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  leaderboardPageSummary: {
    flex: 1,
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: SIZES.RADIUS_MEDIUM,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  leaderboardRowCurrent: {
    borderColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  leaderboardRankBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  leaderboardRankText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: "700",
    color: COLORS.GRAY_DARK,
  },
  leaderboardAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  leaderboardAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    backgroundColor: COLORS.GRAY_200,
    justifyContent: "center",
    alignItems: "center",
  },
  leaderboardAvatarPlaceholderText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: "700",
    color: COLORS.GRAY_700,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: "600",
    color: COLORS.GRAY_DARK,
  },
  leaderboardMeta: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
    marginTop: 4,
  },
  leaderboardScore: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  leaderboardScoreValue: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: "700",
    color: COLORS.GRAY_DARK,
  },
  leaderboardScoreLabel: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_500,
    marginTop: 4,
  },
  leaderboardPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  leaderboardPaginationButton: {
    minWidth: 92,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: SIZES.RADIUS_MEDIUM,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
  },
  leaderboardPaginationButtonDisabled: {
    backgroundColor: COLORS.GRAY_200,
  },
  leaderboardPaginationButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.SIZE.XS,
    fontWeight: "700",
  },
  leaderboardPaginationButtonTextDisabled: {
    color: COLORS.GRAY_500,
  },
  leaderboardPaginationText: {
    flex: 1,
    textAlign: "center",
    fontSize: FONTS.SIZE.XS,
    color: COLORS.GRAY_700,
    fontWeight: "600",
  },
});
