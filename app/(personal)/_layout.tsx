import { Stack } from 'expo-router';
import { AuthProvider } from 'hooks/use-auth';

export default function AppLayout(): React.ReactElement {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen
          name="create-routine"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
