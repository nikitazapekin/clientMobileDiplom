import { COLORS, FONTS } from "appStyles";
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  addBar: {
    flexGrow: 0,
  },
  addButton: {
    backgroundColor: COLORS.GRAY_DARK,
    borderRadius: 999,
    marginRight: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: "700",
  },
  blocksWrap: {
    gap: 16,
  },
  blockCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  blockHeader: {
    gap: 12,
    marginBottom: 14,
  },
  blockTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "700",
  },
  blockHeaderActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  headerActionButton: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerActionText: {
    color: COLORS.GRAY_700,
    fontSize: 12,
    fontWeight: "700",
  },
  headerDangerButton: {
    backgroundColor: "#FCEEEE",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerDangerText: {
    color: COLORS.ERROR,
    fontSize: 12,
    fontWeight: "700",
  },
  fieldGroup: {
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.GRAY_50,
    borderColor: COLORS.GRAY_200,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.SM,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  pickerWrap: {
    backgroundColor: COLORS.GRAY_50,
    borderColor: COLORS.GRAY_200,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableEditorWrap: {
    gap: 12,
  },
  tableEditor: {
    gap: 10,
  },
  tableRow: {
    flexDirection: "row",
    gap: 10,
  },
  tableInput: {
    minWidth: 140,
  },
  tableActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: "#9F0FA7",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
});
