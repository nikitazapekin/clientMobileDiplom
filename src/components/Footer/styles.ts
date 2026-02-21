import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 10,
    paddingHorizontal: 10,
    backgroundColor: COLORS.GRAY_DARK,
  },
  footerButton: {
    width: 60,
    height: 60,
    borderRadius: 65,
    backgroundColor: COLORS.GRAY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
//    marginHorizontal: 4,
    padding: 8,
  },
  footerButtonActive: {
    borderWidth: 2,
    borderColor: COLORS.GRAY_DARK,
  },
  footerButtonIcon: {
    width: 34,
    height: 34,
    marginBottom: 2,
  },
 
  footerButtonTextActive: {
    color: COLORS.GRAY_DARK,
  },
});
