import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { UserCupAward, getCupInfoByTier } from '@/types/collaborative-score';

type CupIndicatorProps = {
  readonly cup?: UserCupAward | null;
  readonly compact?: boolean;
  readonly showLabel?: boolean;
  readonly transparent?: boolean;
  readonly large?: boolean;
};

export function CupIndicator({
  cup,
  compact = false,
  showLabel = !compact,
  transparent = false,
  large = false,
}: CupIndicatorProps): React.ReactElement | null {
  const cupInfo = getCupInfoByTier(cup?.tier);

  if (!cup || !cupInfo) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        large && styles.containerLarge,
        transparent
          ? styles.containerTransparent
          : { backgroundColor: `${cupInfo.color}22`, borderColor: `${cupInfo.color}66` },
      ]}
    >
      <Ionicons
        name="trophy"
        size={large ? 18 : compact ? 11 : 12}
        color={cupInfo.color}
        style={styles.icon}
      />
      {showLabel ? (
        <Text style={[styles.label, large && styles.labelLarge, { color: cupInfo.color }]} numberOfLines={1}>
          {cupInfo.label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 1,
  },
  containerCompact: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  containerLarge: {
    gap: 6,
  },
  containerTransparent: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  icon: {
    marginRight: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  labelLarge: {
    fontSize: 16,
    fontWeight: '800',
  },
});
