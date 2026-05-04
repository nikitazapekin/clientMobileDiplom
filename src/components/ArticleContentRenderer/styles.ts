
import { COLORS, FONTS } from "appStyles";
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  textBlock: {
    color: COLORS.GRAY_800,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 25,
  },
  mediaBlock: {
    gap: 10,
  },
  image: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 20,
    height: 220,
    width: "100%",
  },
  caption: {
    color: COLORS.GRAY_500,
    fontSize: 13,
  },
  linkCard: {
    backgroundColor: "#EEF7E8",
    borderRadius: 18,
    padding: 16,
  },
  linkLabel: {
    color: COLORS.PRIMARY,
    fontSize: FONTS.SIZE.SM,
    fontWeight: "700",
  },
  linkUrl: {
    color: COLORS.GRAY_700,
    fontSize: 13,
    marginTop: 6,
  },
  tableCard: {
    borderColor: COLORS.GRAY_200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    borderBottomColor: COLORS.GRAY_200,
    borderBottomWidth: 1,
    borderRightColor: COLORS.GRAY_200,
    borderRightWidth: 1,
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableHeaderCell: {
    backgroundColor: COLORS.GRAY_100,
  },
  tableCellText: {
    color: COLORS.GRAY_800,
    fontSize: 13,
  },
  tableHeaderText: {
    fontWeight: "700",
  },
  codeBlock: {
    gap: 10,
  },
  codeLabel: {
    color: COLORS.GRAY_700,
    fontSize: 13,
    fontWeight: "700",
  },
});
