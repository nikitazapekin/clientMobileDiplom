// app/lesson/[id]/styles.ts
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
   // color: COLORS.GRAY,
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
    width: 40,
    height: 40,
    borderRadius: 20,
   // backgroundColor: COLORS.PURPLE,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sourcesButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "600",
  },
  progress: {
    fontSize: 14,
  //  color: COLORS.GRAY,
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
  taskDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.BLACK,
    marginBottom: 10,
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
  //  borderColor: COLORS.GREEN,
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
  //  borderColor: COLORS.GREEN,
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
  //  borderColor: COLORS.PURPLE,
    backgroundColor: "#F3E5F5",
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  //  borderColor: COLORS.GRAY,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
//    backgroundColor: COLORS.PURPLE,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.BLACK,
    flex: 1,
  },
  correctText: {
    marginTop: 10,
//color: COLORS.GREEN,
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
    width: "80%",
    maxHeight: "80%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    padding: 20,
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
 //   color: COLORS.GRAY,
  },
  modalBody: {
    maxHeight: 300,
  },
  noSourcesText: {
    fontSize: 16,
 //   color: COLORS.GRAY,
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
 //   color: COLORS.BLUE,
    textDecorationLine: "underline",
    marginBottom: 5,
  },
  sourceNote: {
    fontSize: 14,
  //  color: COLORS.GRAY,
  },
});