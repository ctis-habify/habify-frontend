import { getBackgroundGradient } from '@/app/theme';
import { ThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AuthProvider } from '../hooks/use-auth';

function RootContent(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const [topColor] = getBackgroundGradient(theme);

  return (
    <AuthProvider>
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
      </View>
    </AuthProvider>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}
