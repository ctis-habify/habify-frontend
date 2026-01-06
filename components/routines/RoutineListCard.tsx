import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  listId: number | string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onPressAddRoutine: (listId: number | string) => void;
};

export function RoutineListCard({ listId, title, subtitle, onPress, onPressAddRoutine }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => onPressAddRoutine(listId)}
        style={styles.plusBtn}
        hitSlop={10}
      >
        <Ionicons name="add" size={22} color="#fff" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(229,231,235,0.95)",
    marginBottom: 14,
  },
  textWrap: { paddingRight: 64 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(17,24,39,0.55)",
  },
  plusBtn: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
});
