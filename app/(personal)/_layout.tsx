import { Stack } from 'expo-router';
import { AuthProvider } from 'hooks/useAuth';

export default function AppLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="routines" />
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
