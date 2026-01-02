import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
};

export function BottomReturnButton({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 18,
    height: 54,
    borderRadius: 18, // Matched from routines.tsx
    backgroundColor: 'rgba(255,255,255,0.1)', // Matched
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Matched
    borderStyle: 'dashed', // Matched
    alignItems: "center",
    justifyContent: "center",
    // Removed Shadows to match the flat/dashed look
  },
  text: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "400" 
  },
});
