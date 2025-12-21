import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Routine } from "../../types/routine";

function remainingColor(mins: number) {
  if (mins <= 30) return "#E74C3C";
  if (mins <= 60) return "#C0392B";
  if (mins <= 240) return "#F39C12";
  return "#2ecc71";
}

type Props = {
  routine: Routine;
  onPress: () => void;
};

// "YYYY-MM-DD" + "HH:mm[:ss]" -> Date
function dateTimeFrom(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!timeStr) return null;

  const timeParts = timeStr.split(":").map((p) => Number(p));
  if (timeParts.length < 2) return null;

  const [h, m, s = 0] = timeParts;

  const base = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(base.getTime())) return null;

  base.setHours(h, m, s, 0);
  return base;
}

export function RoutineCard({ routine, onPress }: Props) {
  const { title, startTime, startDate } = routine as any;

  const { minsLeft, label } = useMemo(() => {
    const start = dateTimeFrom(startDate, startTime);
    if (!start) return { minsLeft: 0, label: "" };

    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // diffStart = start - now
    //  >0  -> gelecekte
    //  <0  -> geçmişte (başlamış)
    const diffStartMs = start.getTime() - now.getTime();
    const absDiff = Math.abs(diffStartMs);

    // 24 saatlik pencerenin dışındaysa hiç göstermiyoruz
    if (absDiff > DAY_MS) {
      return { minsLeft: 0, label: "" };
    }

    // Gelecekte ama 24 saat içinde -> "Starts in X Hours"
    if (diffStartMs >= 0) {
      const hoursUntilStart = Math.ceil(diffStartMs / (60 * 60 * 1000));
      return {
        minsLeft: hoursUntilStart * 60,
        label: `Starts in ${hoursUntilStart} Hours`,
      };
    }

    // Başladı ve üzerinden 24 saatten az geçmiş -> "X Hours left"
    const elapsedSinceStartMs = -diffStartMs;          // now - start
    const remainingMs = DAY_MS - elapsedSinceStartMs;  // 24h - geçen süre
    const hoursLeft = Math.ceil(remainingMs / (60 * 60 * 1000));

    return {
      minsLeft: hoursLeft * 60,
      label: `${hoursLeft} Hours left`,
    };
  }, [startTime, startDate]);

  // Label boşsa: 24 saatlik pencerenin dışı → kartı hiç render etme
  if (!label) {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const color = useMemo(() => remainingColor(minsLeft), [minsLeft]);

  return (
    <Pressable onPress={onPress} style={styles.shadow}>
      <View style={styles.card}>
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>

          <Text style={[styles.duration, { color }]}>{label}</Text>
        </View>

        {/* Kamera ikonu */}
        <Pressable
          onPress={() => console.log("Camera pressed:", routine.id)}
          style={styles.cameraTouchable}
          hitSlop={10}
        >
          <Ionicons name="camera" size={22} color="#1B2A6B" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 14,
    marginVertical: 9,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "rgba(245,245,245,0.95)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textWrap: { flex: 1, paddingRight: 10 },
  name: {
    color: "#1B2A6B",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  duration: { fontSize: 14, fontWeight: "800" },

  cameraTouchable: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
