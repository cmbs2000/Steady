import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/auth/AuthProvider';
import { SelectionProvider } from '@/data/selection';
import { ThemeProvider, useThemeColors, useThemePreference } from '@/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}

function RootLayoutInner() {
  const colors = useThemeColors();
  const { scheme } = useThemePreference();
  return (
    <AuthProvider>
      <SelectionProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
