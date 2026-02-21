import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_DARK,
  },

   containerLight: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  containerWhite: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },

  content: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
 
  },
 
  contentContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 2,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,

    color: COLORS.WHITE,
  },
});