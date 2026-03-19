import { StyleSheet } from "react-native";
import { COLORS, SIZES, FONTS } from "appStyles";

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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noAchievementsText: {
    fontSize: FONTS.SIZE.MD,
    color: COLORS.GRAY_600,
    textAlign: "center",
    marginTop: 16,
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
});
