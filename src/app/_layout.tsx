import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/auth/AuthProvider';
import { SelectionProvider } from '@/data/selection';
import { useThemeColors } from '@/theme';

export default function RootLayout() {
  const colors = useThemeColors();
  return (
    <AuthProvider>
      <SelectionProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="checkin/[sponseeId]" options={{ headerShown: false }} />
        </Stack>
      </SelectionProvider>
    </AuthProvider>
  );
}
