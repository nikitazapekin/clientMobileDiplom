import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";
import { COLORS } from "appStyles";

export const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.76, 308);

const topInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

export const styles = StyleSheet.create({

  logo: {
width: 50, 
height: 50
  }, 
  header: {
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderBottomColor: "#EFEFEF",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 13,
    paddingLeft: 28,
    paddingRight: 28,
    paddingTop: topInset + 10,
  },
  logoButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  menuButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 42,
  },
  menuBars: {
    gap: 4,
  },
  menuBar: {
    backgroundColor: "#878787",
 //   borderRadius: 999,
    height: 5,
    width: 35,
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  backdropPressable: {
    flex: 1,
  },
  drawer: {
    backgroundColor: COLORS.WHITE,
  //  borderBottomLeftRadius: 28,
   // borderTopLeftRadius: 28,
    bottom: 0,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: topInset + 28,
    position: "absolute",
    right: 0,
    top: 0,
    width: DRAWER_WIDTH,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 24,
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: "#E4E4E4",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  avatarCircleLoading: {
    backgroundColor: "#F0F0F0",
  },
  avatarImage: {
    borderRadius: 32,
    height: 64,
    width: 64,
  },
  avatarInitials: {
    color: COLORS.GRAY_DARK,
    fontSize: 22,
    fontWeight: "700",
  },
  profileTextBlock: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: COLORS.GRAY_DARK,
    fontSize: 18,
    fontWeight: "700",
  },
  profileEmail: {
    color: "#7E7E7E",
    fontSize: 13,
  },
  menuItems: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#FAFAFA",
    borderColor: "#ECECEC",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  menuItemText: {
    color: COLORS.GRAY_DARK,
    fontSize: 17,
    fontWeight: "600",
  },
});
