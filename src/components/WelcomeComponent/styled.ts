import { StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
    color: COLORS.WHITE,
  },
  gap: {
    height: 20,
  },
  image: {
    width: 356,
    height: 356,
    marginBottom: 30,
  },

  button: {
    backgroundColor: "#1280b2",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "bold",
  }
});
