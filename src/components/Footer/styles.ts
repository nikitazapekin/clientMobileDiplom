import { Platform, StatusBar, StyleSheet } from "react-native";
import { COLORS } from "appStyles";

const bottomPadding = Platform.OS === "android" ? 18 : 28;
const topInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

export const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderTopColor: "#EFEFEF",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 44,
    paddingHorizontal: 34,
    paddingTop: Math.max(14, topInset * 0.15),
  },
  footerButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  footerButtonActive: {
    backgroundColor: "#F3F3F3",
  },
  footerButtonIcon: {
    height: 40,
    resizeMode: "contain",
    width: 40,
  },
  footerButtonIconInactive: {
    opacity: 0.72,
  },
});
