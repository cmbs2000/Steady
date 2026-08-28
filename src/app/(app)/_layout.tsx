import { Redirect, Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { registerForPushNotifications } from '@/lib/pushNotifications';
import { colors } from '@/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const handledNotificationId = useRef<string | null>(null);

  useEffect(() => {
    if (session) {
      registerForPushNotifications().catch((err) => console.error('Push registration failed:', err));
    }
  }, [session]);

  // router isn't a dependency here on purpose — useRouter() doesn't
  // guarantee a stable reference, and including it caused an infinite
  // render loop (effect fires -> router.push -> re-render -> new router
  // identity -> effect fires again). The ref guard also stops the same
  // response from re-triggering navigation on unrelated re-renders.
  useEffect(() => {
    const notificationId = lastNotificationResponse?.notification.request.identifier;
    const sponseeId = lastNotificationResponse?.notification.request.content.data?.sponseeId;
    if (typeof sponseeId === 'string' && notificationId && handledNotificationId.current !== notificationId) {
      handledNotificationId.current = notificationId;
      router.push(`/sponsee/${sponseeId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastNotificationResponse]);

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
