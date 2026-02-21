import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';

interface AnimatedTabSwitcherProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
  activeColor?: string;
  inactiveColor?: string;
}

export function AnimatedTabSwitcher({
  tabs,
  activeTab,
  onTabPress,
  activeColor = '#06b6d4',
  inactiveColor = 'rgba(255,255,255,0.7)',
}: AnimatedTabSwitcherProps) {
  
  const activeIndex = tabs.indexOf(activeTab);
  
  // We assume 2 tabs for simplicity in calculation, but can be dynamic using onLayout
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      left: withSpring(`${activeIndex * (100 / tabs.length)}%`, {
          mass: 0.8,
          damping: 15,
          stiffness: 150,
      }),
    };
  });

  return (
    <View style={styles.container}>
        {/* Animated Background Indicator */}
        <Animated.View 
            style={[
                styles.indicator, 
                { width: `${100 / tabs.length}%` },
                indicatorStyle
            ]} 
        />

        {/* Tab Buttons */}
        {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
                <TouchableOpacity
                    key={tab}
                    style={styles.tab}
                    onPress={() => onTabPress(tab)}
                    activeOpacity={0.8}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: isActive ? activeColor : inactiveColor, fontWeight: isActive ? '700' : '400' }
                    ]}>
                        {tab}
                    </Text>
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
  },
});
