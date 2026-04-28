import { Toast } from '@/components/ui/toast';
import { OfflineBanner } from '@/components/ui/offline-banner';

import { SplashScreen } from '@/components/splash/splash-screen';
import { getBackgroundGradient } from '@/constants/theme';
import { ThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';
import { useToast } from '@/hooks/use-toast';
import { Stack } from 'expo-router';
import * as React from 'react';
import { View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../hooks/use-auth';
import { useNotifications } from '../hooks/use-notifications';

function NotificationSetup(): null {
  const { token } = useAuth();
  useNotifications(!!token);
  return null;
}

function GlobalToast(): React.ReactElement | null {
  const { visible, message, icon, hide } = useToast();
  return <Toast visible={visible} message={message} icon={icon} onClose={hide} />;
}

function RootContent(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const [topColor] = getBackgroundGradient(theme);
  const { initialized } = useAuth();
  const [minimumSplashElapsed, setMinimumSplashElapsed] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashElapsed(true), 1700);
    return () => clearTimeout(timer);
  }, []);

  if (!initialized || !minimumSplashElapsed) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: topColor }}>
      <NotificationSetup />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 220,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(personal)" />
        <Stack.Screen name="(collaborative)" />
      </Stack>
      <GlobalToast />
      <OfflineBanner />
    </View>

  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
