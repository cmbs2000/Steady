import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { registerForPushNotifications } from '@/lib/pushNotifications';
import { colors } from '@/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (session) {
      registerForPushNotifications().catch(() => {});
    }
  }, [session]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="sponsee/[id]/index" options={{ title: 'Sponsee' }} />
      <Stack.Screen name="sponsee/[id]/edit" options={{ title: 'Edit Sponsee', presentation: 'modal' }} />
      <Stack.Screen name="worksheet/[id]/index" options={{ title: 'Worksheet' }} />
      <Stack.Screen name="worksheet/[id]/edit" options={{ title: 'Edit Worksheet', presentation: 'modal' }} />
      <Stack.Screen name="worksheet/new" options={{ title: 'New Worksheet', presentation: 'modal' }} />
      <Stack.Screen name="add-sponsee" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
