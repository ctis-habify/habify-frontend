import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  return (
    <LinearGradient colors={getBackgroundGradient(theme)} style={styles.background}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                  shadowOpacity: isDark ? 0.25 : 0.15,
                  shadowColor: isDark ? '#000' : colors.text,
                },
              ]}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  card: {
    width: '90%',
    minWidth: 340,
    borderRadius: 40,
    paddingVertical: 30,
    paddingHorizontal: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative', 
    alignItems: 'center',
  },
});
