import { ThemeProvider } from "@/hooks/use-color-scheme";
import { Slot } from 'expo-router';
import { AuthProvider } from "../hooks/use-auth";

export default function RootLayout(): React.ReactElement {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </ThemeProvider>
  );
}