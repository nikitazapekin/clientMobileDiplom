import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    padding: 20,
    maxWidth: 350,
    width: "100%",
  
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 10
  },

  field: {
    flexDirection: "column",
    gap: 5,
    width: "100%"
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.BLACK,
  },
  preview: {
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row"
  },
  label: {

  },

  input: {

    borderRadius: 5,
    padding: 3,
    backgroundColor: COLORS.GRAY_LIGHT,

    width: "100%",

    height: 40
  },

  error: {
    color: COLORS.ERROR,
    maxWidth: 200,

    textAlign: "right",

  },

  inputError: {
    backgroundColor: COLORS.ERROR,
    opacity: 0.8,
  },
});
