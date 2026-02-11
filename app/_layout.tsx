import { Slot } from 'expo-router';
import { AuthProvider } from "../hooks/use-auth";

export default function RootLayout(): React.ReactElement {
  return (
    <AuthProvider>
      <Slot/>
    </AuthProvider>
  );
}