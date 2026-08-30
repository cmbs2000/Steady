import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { type ThemeColors, type ThemePreference, useThemeColors, useThemePreference } from '@/theme';

const APPEARANCE_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { preference, setPreference } = useThemePreference();
  const { session, signOut, deleteAccount } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmSignOut = () => {
    Alert.alert('Sign out?', "You'll need a new code from your email to sign back in.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      setDeleting(false);
      Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Please try again.');
    }
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

      <View style={[styles.card, styles.appearanceCard]}>
        <Text style={styles.label}>Appearance</Text>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((opt) => {
            const active = opt.key === preference;
            return (
              <Pressable
                key={opt.key}
                style={[styles.appearanceOption, active && styles.appearanceOptionActive]}
                onPress={() => setPreference(opt.key)}>
                <Ionicons name={opt.icon} size={16} color={active ? colors.primary : colors.textSecondary} />
                <Text style={[styles.appearanceOptionText, active && styles.appearanceOptionTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.navRow} onPress={() => router.push('/sponsorship-log')}>
        <Ionicons name="time-outline" size={18} color={colors.text} />
        <Text style={styles.navRowText}>Sponsorship Log</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={confirmSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.overdue} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerLabel}>Danger Zone</Text>
        {!confirmingDelete ? (
          <Pressable style={styles.deleteButton} onPress={() => setConfirmingDelete(true)}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              This permanently deletes your account and every sponsee, worksheet assignment, and note attached to
              it. This cannot be undone. Type DELETE to confirm.
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="DELETE"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.confirmInput}
              editable={!deleting}
            />
            <Pressable
              style={[styles.deleteButton, confirmText !== 'DELETE' && styles.deleteButtonDisabled]}
              onPress={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || deleting}>
              {deleting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.deleteButtonText}>Permanently Delete My Account</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                setConfirmingDelete(false);
                setConfirmText('');
              }}
              disabled={deleting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.versionText}>Steady v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  appearanceCard: { marginTop: 12, gap: 10 },
  appearanceRow: { flexDirection: 'row', gap: 8 },
  appearanceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  appearanceOptionActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  appearanceOptionText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  appearanceOptionTextActive: { color: colors.primary },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  navRowText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
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
  dangerZone: { marginHorizontal: 16, marginTop: 40, gap: 10 },
  dangerLabel: { fontSize: 12, fontWeight: '700', color: colors.overdue, textTransform: 'uppercase' },
  confirmBox: {
    backgroundColor: colors.overdueLight,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  confirmText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  confirmInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.overdue,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  cancelText: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: colors.textSecondary, paddingVertical: 4 },
  deleteButton: {
    backgroundColor: colors.overdue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: { opacity: 0.4 },
  deleteButtonText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  versionText: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: 'auto', marginBottom: 20 },
});
