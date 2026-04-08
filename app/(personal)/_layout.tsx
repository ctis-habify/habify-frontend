import { Stack } from 'expo-router';
export default function AppLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
      <Stack.Screen
        name="create-routine"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="friend-profile"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

