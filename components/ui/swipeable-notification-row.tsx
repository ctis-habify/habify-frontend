import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeOut,
  LinearTransition,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

export function SwipeableNotificationRow({ onDelete, children }: Props): React.ReactElement {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleSwipeOpen = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        onDelete();
      }
    },
    [onDelete],
  );

  const handleDeletePress = useCallback(() => {
    swipeableRef.current?.close();
    onDelete();
  }, [onDelete]);

  const renderRightActions = useCallback(
    (_prog: SharedValue<number>, drag: SharedValue<number>) => (
      <RightActionButton drag={drag} onPress={handleDeletePress} />
    ),
    [handleDeletePress],
  );

  return (
    <Animated.View exiting={FadeOut.duration(250)} layout={LinearTransition.duration(300)}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeOpen}
      >
        {children}
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

function RightActionButton({
  drag,
  onPress,
}: {
  drag: SharedValue<number>;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 72 }],
  }));

  return (
    <Animated.View style={[styles.rightActionWrapper, animatedStyle]}>
      <Pressable style={styles.rightAction} onPress={onPress}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rightActionWrapper: {
    width: 72,
    alignItems: 'stretch',
  },
  rightAction: {
    flex: 1,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
