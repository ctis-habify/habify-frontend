import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { Logo } from '../ui/logo';

export function AuthHeader(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View style={styles.header}>
      <Logo width={180} height={90} style={styles.icon} />
      <ThemedText type="heading1" style={[styles.appName, { color: colors.text }]}>Habify</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginBottom: 5,
  },
  appName: {
    fontSize: 32,
    marginTop: 4,
    ...Platform.select({
      ios: {
        fontFamily: 'Avenir Next',
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      android: {
        fontFamily: 'serif',
        fontWeight: '700',
        letterSpacing: 0.5,
      },
      default: {
        fontWeight: '700',
      }
    }),
  },
});
