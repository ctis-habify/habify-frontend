import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LeaderboardMedal,
  getLeaderboardMedalInfo,
} from '@/types/collaborative-score';

type LeaderboardMedalIndicatorProps = {
  readonly medal?: LeaderboardMedal | null;
};

export function LeaderboardMedalIndicator({
  medal,
}: LeaderboardMedalIndicatorProps): React.ReactElement | null {
  const medalInfo = getLeaderboardMedalInfo(medal);

  if (!medalInfo) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `${medalInfo.color}18`, borderColor: `${medalInfo.color}55` },
      ]}
    >
      <Text style={styles.icon}>{medalInfo.icon}</Text>
      <Text style={[styles.label, { color: medalInfo.color }]} numberOfLines={1}>
        {medalInfo.label}
      </Text>
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
  icon: {
    fontSize: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
});
