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

function TabLabel({
  text,
  index,
  activeIndexSV,
  activeColor,
  inactiveColor,
}: TabLabelProps) {
  const tabTextStyle = useAnimatedStyle(() => {
    const distance = Math.abs(activeIndexSV.value - index);
    const opacity = interpolate(distance, [0, 1], [1, 0.65]);

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
  activeColor = '#06b6d4',
  inactiveColor = 'rgba(255,255,255,0.7)',
}: AnimatedTabSwitcherProps) {
  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const activeIndexSV = useSharedValue(activeIndex);
  const containerWidthSV = useSharedValue(0);

  useEffect(() => {
    activeIndexSV.value = withTiming(activeIndex, {
      duration: 220,
      easing: Easing.out(Easing.exp),
    });
  }, [activeIndex, activeIndexSV]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    containerWidthSV.value = event.nativeEvent.layout.width;
  };

  const tabWidth = tabs.length > 0 ? 1 / tabs.length : 1;

  const indicatorStyle = useAnimatedStyle(() => {
    const tabPixelWidth = containerWidthSV.value * tabWidth;

    return {
      width: tabPixelWidth,
      transform: [{ translateX: activeIndexSV.value * tabPixelWidth }],
    };
  });

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
        {/* Animated Background Indicator */}
        <Animated.View 
            style={[
                styles.indicator, 
                indicatorStyle
            ]} 
        />

        {/* Tab Buttons */}
        {tabs.map((tab, index) => {
            return (
                <TouchableOpacity
                    key={tab}
                    style={styles.tab}
                    onPress={() => onTabPress(tab)}
                    activeOpacity={0.9}
                >
                    <TabLabel
                      text={tab}
                      index={index}
                      activeIndexSV={activeIndexSV}
                      activeColor={activeColor}
                      inactiveColor={inactiveColor}
                    />
                </TouchableOpacity>
            );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)', // Glassmorphism container
    borderRadius: 24,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure text is above indicator
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
