import { StyleSheet } from "react-native";

export const COLORS = {
  PRIMARY: "#1280b2",
  SECONDARY: "#993B4A",
  ACCENT: "#41C5FF",
  GRAY_LIGHT: "#D1D5DB",
  GRAY_BORDER: "#e5e7eb",
  GRAY_DARK: "#6B7280",
  GRAY_TEXT: "#4B5563",
  WHITE: "#fff",
  BLACK: "#000",

  TURQUOISE_LIGHT: "#DCF4FF",
  TURQUOISE_DARK: "#C2D4DC",

  BLUE_LIGHT: "#B4E8FF",
  BLUE_DARK: "#41C5FF",
  BLUE_MEDIUM: "#54C3F5",

  GREEN_LIGHT: "#4FE7A5",

  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  INFO: "#3B82F6",
  SCHEDULED: "#11A3E5",
};

export const SIZES = {
  RADIUS_SMALL: 4,
  RADIUS_MEDIUM: 8,
  RADIUS_LARGE: 16,
  RADIUS_XLARGE: 24,
  RADIES_CIRCLE: 9999,

  SPACING_XS: 4,
  SPACING_SM: 8,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,
  SPACING_XXL: 48,

  ICON_SM: 16,
  ICON_MD: 24,
  ICON_LG: 32,
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 56,
};

export const FONTS = {
  FAMILY: "Inter",

  WEIGHT: {
    THIN: "100",
    EXTRALIGHT: "200",
    LIGHT: "300",
    REGULAR: "400",
    MEDIUM: "500",
    SEMIBOLD: "600",
    BOLD: "700",
    EXTRABOLD: "800",
    BLACK: "900",
  },

  SIZE: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
    HEADING: 28,
  },

  LINE_HEIGHT: {
    XS: 16,
    SM: 20,
    MD: 24,
    LG: 28,
    XL: 32,
  },
};

export const utilityStyles = StyleSheet.create({
  p4: { padding: SIZES.SPACING_XS },
  p8: { padding: SIZES.SPACING_SM },
  p16: { padding: SIZES.SPACING_MD },
  p24: { padding: SIZES.SPACING_LG },

  px4: { paddingHorizontal: SIZES.SPACING_XS },
  px8: { paddingHorizontal: SIZES.SPACING_SM },
  px16: { paddingHorizontal: SIZES.SPACING_MD },
  px24: { paddingHorizontal: SIZES.SPACING_LG },

  py4: { paddingVertical: SIZES.SPACING_XS },
  py8: { paddingVertical: SIZES.SPACING_SM },
  py16: { paddingVertical: SIZES.SPACING_MD },
  py24: { paddingVertical: SIZES.SPACING_LG },

  m4: { margin: SIZES.SPACING_XS },
  m8: { margin: SIZES.SPACING_SM },
  m16: { margin: SIZES.SPACING_MD },
  m24: { margin: SIZES.SPACING_LG },

  mx4: { marginHorizontal: SIZES.SPACING_XS },
  mx8: { marginHorizontal: SIZES.SPACING_SM },
  mx16: { marginHorizontal: SIZES.SPACING_MD },
  mx24: { marginHorizontal: SIZES.SPACING_LG },

  my4: { marginVertical: SIZES.SPACING_XS },
  my8: { marginVertical: SIZES.SPACING_SM },
  my16: { marginVertical: SIZES.SPACING_MD },
  my24: { marginVertical: SIZES.SPACING_LG },

  textCenter: { textAlign: "center" },
  textLeft: { textAlign: "left" },
  textRight: { textAlign: "right" },

  bgPrimary: { backgroundColor: COLORS.PRIMARY },
  bgSecondary: { backgroundColor: COLORS.SECONDARY },
  bgWhite: { backgroundColor: COLORS.WHITE },
  bgGrayLight: { backgroundColor: COLORS.GRAY_LIGHT },
  bgTurquoiseLight: { backgroundColor: COLORS.TURQUOISE_LIGHT },

  textPrimary: { color: COLORS.PRIMARY },
  textSecondary: { color: COLORS.SECONDARY },
  textWhite: { color: COLORS.WHITE },
  textBlack: { color: COLORS.BLACK },
  textGrayDark: { color: COLORS.GRAY_DARK },
  textGrayLight: { color: COLORS.GRAY_LIGHT },

  border: { borderWidth: 1, borderColor: COLORS.GRAY_LIGHT },
  borderPrimary: { borderWidth: 1, borderColor: COLORS.PRIMARY },
  borderSecondary: { borderWidth: 1, borderColor: COLORS.SECONDARY },

  roundedSm: { borderRadius: SIZES.RADIUS_SMALL },
  roundedMd: { borderRadius: SIZES.RADIUS_MEDIUM },
  roundedLg: { borderRadius: SIZES.RADIUS_LARGE },
  roundedXl: { borderRadius: SIZES.RADIUS_XLARGE },
  roundedFull: { borderRadius: SIZES.RADIES_CIRCLE },

  wFull: { width: "100%" },
  hFull: { height: "100%" },
});

export default {
  COLORS,
  SIZES,
  FONTS,
  utilityStyles,
};
