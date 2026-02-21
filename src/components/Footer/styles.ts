import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 10,
    backgroundColor: COLORS.WHITE,
  },
  footerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.GRAY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  footerButtonActive: {
    borderWidth: 2,
    borderColor: COLORS.GRAY_DARK,
  },
  footerButtonText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.GRAY_DARK,
    textAlign: "center",
  },
  footerButtonTextActive: {
    color: COLORS.GRAY_DARK,
  },
});
