import { Stack } from 'expo-router';
export default function AppLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
      <Stack.Screen
        name="routine/[id]"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="routine/[id]/chat"
        options={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="create-routine"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="camera-modal"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
