import { StyleSheet } from "react-native";

export const COLORS = {
  PRIMARY: "#379c07",  
  SECONDARY: "#e29f22", 
  ACCENT: "#9f0fa7", 
  GRAY_LIGHT: "#f0f0f0", 
  GRAY_BORDER: "#d8d8d8",  
  GRAY_DARK: "#303027", 
  GRAY_TEXT: "#222121", 
  WHITE: "#ffffff",  
  BLACK: "#000000",  

  TURQUOISE_LIGHT: "#f0f0f0", // используем GRAY_LIGHT как замену
  TURQUOISE_DARK: "#d8d8d8", // используем GRAY_BORDER как замену

  BLUE_LIGHT: "#9f0fa7", // используем ACCENT как замену
  BLUE_DARK: "#9f0fa7", // используем ACCENT как замену
  BLUE_MEDIUM: "#9f0fa7", // используем ACCENT как замену

  GREEN_LIGHT: "#379c07", // используем PRIMARY как замену

  SUCCESS: "#10b981", // из $color-success
  WARNING: "#f59e0b", // из $color-warning
  ERROR: "#d80909", // был $color-red
  INFO: "#9f0fa7", // используем ACCENT как замену
  SCHEDULED: "#379c07", // используем PRIMARY как замену

  // Дополнительные цвета из SCSS
  GRAY_50: "#f9fafb",
  GRAY_100: "#f3f4f6",
  GRAY_200: "#e5e7eb",
  GRAY_300: "#d1d5db",
  GRAY_400: "#9ca3af",
  GRAY_500: "#6b7280",
  GRAY_600: "#4b5563",
  GRAY_700: "#374151",
  GRAY_800: "#1f2937",
  GRAY_900: "#111827",
};

export const SIZES = {
  RADIUS_SMALL: 4, // из $radius-small
  RADIUS_MEDIUM: 8, // из $radius-medium
  RADIUS_LARGE: 16, // из $radius-large
  RADIUS_XLARGE: 24, // из $radius-xlarge
  RADIES_CIRCLE: 9999, // из $radius-circle

  SPACING_XS: 4, // из $spacing-xs
  SPACING_SM: 8, // из $spacing-sm
  SPACING_MD: 16, // из $spacing-md
  SPACING_LG: 24, // из $spacing-lg
  SPACING_XL: 32, // из $spacing-xl
  SPACING_XXL: 48, // из $spacing-xxl
  SPACING_BG: 60, // из $spacing-bg
  SPACING_VG: 80, // из $spacing-vg

  ICON_SM: 16,
  ICON_MD: 24,
  ICON_LG: 32,
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 56,

  // Контейнеры
  CONTAINER_XS: 700, // из $container-xs
  CONTAINER_SM: 1280, // из $container-sm
  CONTAINER_MD: 1400, // из $container-md
};

export const FONTS = {
  FAMILY: "Inter", // из $font-primary

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
    XS: 14, // из $font-xs
    SM: 16, // промежуточное значение
    MD: 20, // из $font-sx
    LG: 24, // из $font-md
    XL: 28, // промежуточное значение
    XXL: 32, // из $font-lg
    XXXL: 40, // увеличенное значение
    HEADING: 32, // из $font-lg
  },

  LINE_HEIGHT: {
    XS: 18,
    SM: 22,
    MD: 26,
    LG: 30,
    XL: 36,
  },

  SECONDARY_FAMILY: "'SF Mono', 'Roboto Mono', monospace", // из $font-secondary
};

export const BREAKPOINTS = {
  XS: 480, // из $breakpoint-xs
  SM: 640, // из $breakpoint-sm
  MD: 768, // из $breakpoint-md
  LG: 1024, // из $breakpoint-lg
  XL: 1280, // из $breakpoint-xl
  XXL: 1536, // из $breakpoint-2xl
};

export const utilityStyles = StyleSheet.create({
  p4: { padding: SIZES.SPACING_XS },
  p8: { padding: SIZES.SPACING_SM },
  p16: { padding: SIZES.SPACING_MD },
  p24: { padding: SIZES.SPACING_LG },
  p32: { padding: SIZES.SPACING_XL },
  p48: { padding: SIZES.SPACING_XXL },
  p60: { padding: SIZES.SPACING_BG },
  p80: { padding: SIZES.SPACING_VG },

  px4: { paddingHorizontal: SIZES.SPACING_XS },
  px8: { paddingHorizontal: SIZES.SPACING_SM },
  px16: { paddingHorizontal: SIZES.SPACING_MD },
  px24: { paddingHorizontal: SIZES.SPACING_LG },
  px32: { paddingHorizontal: SIZES.SPACING_XL },
  px48: { paddingHorizontal: SIZES.SPACING_XXL },

  py4: { paddingVertical: SIZES.SPACING_XS },
  py8: { paddingVertical: SIZES.SPACING_SM },
  py16: { paddingVertical: SIZES.SPACING_MD },
  py24: { paddingVertical: SIZES.SPACING_LG },
  py32: { paddingVertical: SIZES.SPACING_XL },
  py48: { paddingVertical: SIZES.SPACING_XXL },

  m4: { margin: SIZES.SPACING_XS },
  m8: { margin: SIZES.SPACING_SM },
  m16: { margin: SIZES.SPACING_MD },
  m24: { margin: SIZES.SPACING_LG },
  m32: { margin: SIZES.SPACING_XL },
  m48: { margin: SIZES.SPACING_XXL },

  mx4: { marginHorizontal: SIZES.SPACING_XS },
  mx8: { marginHorizontal: SIZES.SPACING_SM },
  mx16: { marginHorizontal: SIZES.SPACING_MD },
  mx24: { marginHorizontal: SIZES.SPACING_LG },
  mx32: { marginHorizontal: SIZES.SPACING_XL },
  mx48: { marginHorizontal: SIZES.SPACING_XXL },

  my4: { marginVertical: SIZES.SPACING_XS },
  my8: { marginVertical: SIZES.SPACING_SM },
  my16: { marginVertical: SIZES.SPACING_MD },
  my24: { marginVertical: SIZES.SPACING_LG },
  my32: { marginVertical: SIZES.SPACING_XL },
  my48: { marginVertical: SIZES.SPACING_XXL },

  textCenter: { textAlign: "center" },
  textLeft: { textAlign: "left" },
  textRight: { textAlign: "right" },

  bgPrimary: { backgroundColor: COLORS.PRIMARY },
  bgSecondary: { backgroundColor: COLORS.SECONDARY },
  bgWhite: { backgroundColor: COLORS.WHITE },
  bgGrayLight: { backgroundColor: COLORS.GRAY_LIGHT },
  bgGray100: { backgroundColor: COLORS.GRAY_100 },
  bgGray200: { backgroundColor: COLORS.GRAY_200 },

  textPrimary: { color: COLORS.PRIMARY },
  textSecondary: { color: COLORS.SECONDARY },
  textWhite: { color: COLORS.WHITE },
  textBlack: { color: COLORS.BLACK },
  textGrayDark: { color: COLORS.GRAY_DARK },
  textGrayLight: { color: COLORS.GRAY_LIGHT },
  textGray500: { color: COLORS.GRAY_500 },
  textGray600: { color: COLORS.GRAY_600 },
  textGray700: { color: COLORS.GRAY_700 },

  border: { borderWidth: 1, borderColor: COLORS.GRAY_BORDER },
  borderPrimary: { borderWidth: 1, borderColor: COLORS.PRIMARY },
  borderSecondary: { borderWidth: 1, borderColor: COLORS.SECONDARY },
  borderGray200: { borderWidth: 1, borderColor: COLORS.GRAY_200 },

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
  BREAKPOINTS,
  utilityStyles,
};