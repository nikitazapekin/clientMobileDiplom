
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "appStyles";
const BRAND_COLOR = "#9F0FA7";
export const styles = StyleSheet.create({
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
    color: BRAND_COLOR,
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
    flexWrap: 'wrap',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  commentActionIcon: {
    width: 20,
    height: 20,
  },
  commentActionIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  commentActionText: {
    fontSize: 13,
    color: '#666',
  },
  commentActionTextLiked: {
    fontSize: 13,
    color: BRAND_COLOR,
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
    backgroundColor: BRAND_COLOR,
    alignItems: 'center',
  },
  commentSubmitButtonText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: '600',
  },
  replyContainer: {
    marginTop: 10,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.GRAY_LIGHT,
  },
});
