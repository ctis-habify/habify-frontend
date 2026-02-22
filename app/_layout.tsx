import { getBackgroundGradient } from '@/app/theme';
import { ThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { AuthProvider } from '../hooks/use-auth';

function RootContent(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const [topColor] = getBackgroundGradient(theme);

  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: topColor }}>
        <Slot />
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
