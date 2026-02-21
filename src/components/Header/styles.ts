import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 8,
    backgroundColor: COLORS.GRAY_DARK,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.WHITE,
    textAlign: "center",
  },
});
