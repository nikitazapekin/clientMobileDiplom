import React from "react";
import { Text, TouchableOpacity } from "react-native";

import { styles } from "./styled";
import type { CustomButtonProps } from "./types";

const CustomButton: React.FC<CustomButtonProps> = ({
  text,
  handler,
  backgroundColor = "#9F0FA7",
  disabled = false,
  color = "#fff",
  fullWidth = false,
  maxWidth,  
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        fullWidth && { width: "100%" },
        maxWidth != null && { width: "100%", maxWidth },
        { backgroundColor },
        disabled && styles.disabled,
      ]}
      onPress={handler}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color }]}>{text}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;