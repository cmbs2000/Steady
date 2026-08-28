import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  const confirmSignOut = () => {
    Alert.alert('Sign out?', "You'll need a new code from your email to sign back in.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>

      <Pressable style={styles.signOutButton} onPress={confirmSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.overdue} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={styles.versionText}>Steady v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  card: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  email: { fontSize: 15, color: colors.text, fontWeight: '600' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.overdue,
    borderRadius: 12,
    paddingVertical: 14,
  },
  signOutText: { color: colors.overdue, fontSize: 15, fontWeight: '700' },
  versionText: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: 'auto', marginBottom: 20 },
});
