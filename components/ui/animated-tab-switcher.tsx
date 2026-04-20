import React, { useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AnimatedTabSwitcherProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
  activeColor?: string;
  inactiveColor?: string;
}

interface TabLabelProps {
  text: string;
  index: number;
  activeIndexSV: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}

interface TabButtonProps {
  tab: string;
  onPress: () => void;
  children: React.ReactNode;
}

function TabButton({ tab, onPress, children }: TabButtonProps) {
  return (
    <TouchableOpacity
      key={tab}
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`${tab} mode`}
    >
      {children}
    </TouchableOpacity>
  );
}

function TabLabel({
  text,
  index,
  activeIndexSV,
  activeColor,
  inactiveColor,
}: TabLabelProps) {
  const tabTextStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndexSV.value - index);
    const opacity = interpolate(distance, [0, 1], [1, 0.75]);

    return {
      opacity,
      color: interpolateColor(distance, [0, 1], [activeColor, inactiveColor]),
    };
  });

  return <Animated.Text style={[styles.tabText, tabTextStyle]}>{text}</Animated.Text>;
}

export function AnimatedTabSwitcher({
  tabs,
  activeTab,
  onTabPress,
  activeColor,
  inactiveColor,
}: AnimatedTabSwitcherProps) {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];

  // Defaults
  const effectiveActiveColor = activeColor || colors.primary;
  const effectiveInactiveColor = inactiveColor || colors.textSecondary;

  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const activeIndexSV = useSharedValue(activeIndex);
  const containerWidthSV = useSharedValue(0);

  useEffect(() => {
    activeIndexSV.value = withTiming(activeIndex, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeIndex, activeIndexSV]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    containerWidthSV.value = event.nativeEvent.layout.width;
  };

  const tabWidth = tabs.length > 0 ? 1 / tabs.length : 1;

  const indicatorStyle = useAnimatedStyle(() => {
    const tabPixelWidth = containerWidthSV.value * tabWidth;
    const translateX = activeIndexSV.value * tabPixelWidth;

    return {
      width: Math.max(0, tabPixelWidth - 8),
      transform: [{ translateX }],
    };
  });

  return (
    <View 
      style={[
        styles.container, 
        { 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', 
            borderColor: colors.border
        }
      ]} 
      onLayout={onContainerLayout}
    >
        {/* Animated Background Indicator */}
        <Animated.View 
            style={[
                styles.indicator, 
                { backgroundColor: colors.surface, shadowColor: colors.text },
                indicatorStyle
            ]} 
        />

        {/* Tab Buttons */}
        {tabs.map((tab, index) => (
          <TabButton key={tab} tab={tab} onPress={() => onTabPress(tab)}>
            <TabLabel
              text={tab}
              index={index}
              activeIndexSV={activeIndexSV}
              activeColor={effectiveActiveColor}
              inactiveColor={effectiveInactiveColor}
            />
          </TabButton>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
