import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.TURQUOISE_LIGHT,
  },
  containerWhite: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },

  content: {
    flex: 1,
    marginTop: 60,
    marginBottom: 80,
  },
  doctorContent: {
    flex: 1,
    marginTop: 60,
    marginBottom: 10,
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
    color: "black",
  },
});