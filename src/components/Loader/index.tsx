import React from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

interface LoaderProps {
  containerStyle?: StyleProp<ViewStyle>;
  size?: "small" | "large";
}

export default function Loader({ containerStyle, size = "large" }: LoaderProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator color="#9f0fa7" size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
