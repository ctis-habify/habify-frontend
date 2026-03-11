import { getBackgroundGradient } from '@/app/theme';
import { Toast } from '@/components/ui/toast';
import { ThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';
import { useToast } from '@/hooks/use-toast';
import { Stack } from 'expo-router';
import { View } from 'react-native';
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
  return <Toast visible={visible} message={message} icon={icon} onHide={hide} />;
}

function RootContent(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const [topColor] = getBackgroundGradient(theme);

  return (
    <AuthProvider>
      <NotificationSetup />
      <View style={{ flex: 1, backgroundColor: topColor }}>
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
      </View>
    </AuthProvider>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
