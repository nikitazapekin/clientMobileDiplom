
import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,

  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.BLACK,
    flex: 1,
  },
  sourcesButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.ACCENT,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sourcesButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "600",
  },
  progress: {
    fontSize: 14,

    textAlign: "right",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    backgroundColor: COLORS.WHITE,
  },
  textBlock: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.BLACK,
    marginBottom: 20,
  },
  codeExampleBlock: {
    marginBottom: 20,
  },
  codeOutput: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 5,
  },
  codeOutputText: {
    fontFamily: "monospace",
    fontSize: 14,
  },
  tableWrapper: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  tableCell: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.GRAY_LIGHT,
  },
  tableCellText: {
    fontSize: 14,
    color: COLORS.BLACK,
  },
  imageBlock: {
    marginBottom: 20,
  },
  codeTaskBlock: {
    marginBottom: 20,
  },
  fillTaskBlock: {
    marginBottom: 20,
  },
  taskDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.BLACK,
    marginBottom: 10,
  },
  fillTaskHint: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.BLACK,
    backgroundColor: "#F8EAF9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  fillTaskMeta: {
    fontSize: 14,
    color: COLORS.BLACK,
    marginTop: 10,
    marginBottom: 10,
  },
  fillTaskInputs: {
    marginTop: 10,
    gap: 12,
  },
  fillTaskInputRow: {
    gap: 6,
  },
  fillTaskLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  fillTaskInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.BLACK,
    backgroundColor: COLORS.WHITE,
  },
  fillTaskSuccess: {
    marginTop: 10,
    color: "#1D7C35",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  testResults: {
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  testCaseResult: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  passedTest: {
    backgroundColor: "#E8F5E9",

  },
  failedTest: {
    backgroundColor: "#FFEBEE",
    borderColor: COLORS.ERROR,
  },
  testCaseTitle: {
    fontWeight: "600",
    marginBottom: 5,
  },
  constraintResults: {
    marginTop: 10,
  },
  constraintResult: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  passedConstraint: {
    backgroundColor: "#E8F5E9",

  },
  failedConstraint: {
    backgroundColor: "#FFEBEE",
    borderColor: COLORS.ERROR,
  },
  constraintName: {
    fontWeight: "600",
    marginBottom: 5,
  },
  consoleOutput: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#1E1E1E",
    borderRadius: 5,
  },
  consoleTitle: {
    color: COLORS.WHITE,
    fontWeight: "600",
    marginBottom: 5,
  },
  consoleText: {
    color: "#00FF00",
    fontFamily: "monospace",
    fontSize: 12,
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#FFEBEE",
    borderRadius: 5,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
  },
  theoryQuestionBlock: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.BLACK,
    marginBottom: 10,
  },
  optionsList: {
    marginVertical: 10,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
  },
  selectedOption: {

    backgroundColor: "#F3E5F5",
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,

    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,

  },
  optionText: {
    fontSize: 16,
    color: COLORS.BLACK,
    flex: 1,
  },
  correctText: {
    marginTop: 10,

    fontSize: 16,
    fontWeight: "600",
  },
  incorrectText: {
    marginTop: 10,
    color: COLORS.ERROR,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 20,

  },
  modalBody: {
    maxHeight: 300,
  },
  noSourcesText: {
    fontSize: 16,

    textAlign: "center",
    padding: 20,
  },
  sourceItem: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  sourceUrl: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    textDecorationLine: "underline",
    marginBottom: 5,
    fontWeight: "500",
  },
  sourceNote: {
    fontSize: 14,

  },
  unknownBlock: {
    padding: 10,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.GRAY_LIGHT,
  },

  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
  },

  imageError: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },

  imageErrorText: {
    fontSize: 14,
    color: COLORS.ERROR,
    marginBottom: 10,
    textAlign: 'center',
  },

  imageUrl: {
    fontSize: 12,

    textAlign: 'center',
    paddingHorizontal: 10,
  },

  starsContainer: {
    position: 'relative',
    height: 100,
    marginVertical: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  starWrapper: {
    position: 'absolute',
    top: 0,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  star: {
    fontSize: 48,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  starFilled: {
    color: '#ffd700',
    textShadowColor: '#ffd700',
    textShadowRadius: 20,
  },

  starEmpty: {
    color: '#4a4a4a',
  },

  resultsModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    padding: 20,
  },

  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },

  summaryItem: {
    alignItems: 'center',
    gap: 5,
  },

  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },

  resultsList: {
    maxHeight: 300,
  },

  resultsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },

  resultItem: {
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },

  resultPassed: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },

  resultFailed: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },

  resultTitle: {
    fontWeight: '500',
    marginBottom: 5,
  },

  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#666',
  },

  modalFooter: {
    marginTop: 20,
    alignItems: 'center',
  },

  testSummary: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },

  constraintSummary: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },

  testCaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  passedText: {
    color: '#4caf50',
    fontWeight: '600',
  },

  failedText: {
    color: '#f44336',
    fontWeight: '600',
  },

  constraintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  theoryImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    backgroundColor: '#f5f5f5',
  },

  correctOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4caf50',
  },

  wrongOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#f44336',
  },

  correctMark: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  commentsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.BLACK,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  commentsButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "600",
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

  commentsList: {
    flex: 1,
    maxHeight: 400,
    marginBottom: 10,
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

  argumentSchemeInfo: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  argumentSchemeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 5,
  },
  argumentSchemeText: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
  },

  objectDescriptions: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CE93D8',
  },
  objectDescriptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B1FA2',
    marginBottom: 5,
  },
  objectCodeScroll: {
    maxHeight: 150,
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    padding: 5,
  },
  objectCodeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333',
  },

  constraintsInfo: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  constraintsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  constraintsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  constraintsToggle: {
    fontSize: 13,
    color: '#F57C00',
  },
  constraintsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFB74D',
  },
  constraintItem: {
    fontSize: 13,
    color: '#333',
    marginBottom: 5,
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

  cannotCommentText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    padding: 10,
    fontStyle: 'italic',
  },
});
