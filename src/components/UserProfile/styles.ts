
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "appStyles";


const SECTION_HORIZONTAL_MARGIN = 20;
const SECTION_PADDING = 20;
const certSlideWidth = Dimensions.get('window').width - (SECTION_HORIZONTAL_MARGIN + SECTION_PADDING) * 2;
 
const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.28;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2 - 10;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
 
const DIFFICULTIES: Record<string, { label: string; color: string }> = {
  easy: { label: "Легкий", color: "#4caf50" },
  medium: { label: "Средний", color: "#ff9800" },
  hard: { label: "Сложный", color: "#f44336" },
};
 

export  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarUploading: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#5a67d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraBadgeText: {
    fontSize: 18,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 5,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  email: {
    fontSize: 16,
    color: '#000000',
    opacity: 0.9,
  },
  friendsButton: {
    marginTop: 15,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  friendsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor:  ''
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#9F0FA7',
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  infoItem: {
    width: '50%',
    padding: 5,
  },
  infoItemFull: {
    width: '100%',
  },
  infoItemLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  statusActive: {
    backgroundColor: '#48bb78',
  },
  statusInactive: {
    backgroundColor: '#f56565',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#f56565',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#f56565',
    fontWeight: '600',
  },
  certSection: {
    backgroundColor: '#fff',
    marginHorizontal: SECTION_HORIZONTAL_MARGIN,
    marginTop: 20,
    padding: SECTION_PADDING,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certSliderContainer: {
    marginTop: 12,
    marginHorizontal: -SECTION_PADDING,
    overflow: 'hidden',
    paddingHorizontal: SECTION_PADDING,
  },
  certImage: {
    width: certSlideWidth,
    height: certSlideWidth * 0.66,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  certDate: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },
  certDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  certDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  certDotActive: {
    backgroundColor: '#9F0FA7',
    width: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  modalListContent: {
    padding: 20,
  },

  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    opacity: 0.85,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  taskDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskFooterBottom: {
    marginTop: 6,
  },
  taskMeta: {
    fontSize: 12,
    color: '#999',
  },
  taskBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  xpBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#667eea",
  },
  xpBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: "700",
  },
  authorText: {
    fontSize: 11,
    color: '#999',
    flex: 1,
    marginRight: 12,
  },
  solvedDateBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  solvedDateText: {
    color: '#666',
    fontSize: 10,
    fontWeight: "500",
  },

  levelSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  circularProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  expInfoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 15,
  },
  expValue: {
    fontSize: 24,
    fontWeight: "700",
    color: '#9F0FA7',
  },
  expSeparator: {
    fontSize: 18,
    color: '#999',
    marginHorizontal: 4,
  },
  expTotal: {
    fontSize: 18,
    color: '#666',
  },
  expLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  starFilled: {
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  starEmpty: {
    color: '#ddd',
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  resultLessonId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultStars: {
    marginVertical: 5,
  },
  resultDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
});