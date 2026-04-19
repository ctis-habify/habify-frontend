import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '@/hooks/use-network';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function OfflineBanner(): React.ReactElement | null {
  const { isOffline } = useNetwork();
  const theme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  
  // Animation value: 0 = hidden (above screen), 1 = visible
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isOffline ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isOffline, animation]);

  // Interpolate translateY: -100 to 0
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  // Calculate top padding based on safe area
  const paddingTop = Platform.OS === 'ios' ? insets.top : (StatusBar.currentHeight || 0) + 10;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop,
          transform: [{ translateY }],
          backgroundColor: theme === 'dark' ? '#1e1b4b' : '#fef3c7', // Dark navy or soft amber
          borderBottomColor: theme === 'dark' ? '#4c1d95' : '#fbbf24',
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name="cloud-offline-outline" 
          size={18} 
          color={theme === 'dark' ? '#a78bfa' : '#d97706'} 
        />
        <Text style={[
          styles.text,
          { color: theme === 'dark' ? '#f5f3ff' : '#92400e' }
        ]}>
          No Internet Connection
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
