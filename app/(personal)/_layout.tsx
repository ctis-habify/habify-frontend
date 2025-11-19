import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="today-routines" />
      <Stack.Screen name="routine-tracker" />
      <Stack.Screen name="routine-create" />
    </Stack>
  );
}
