import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setCheckinAssignmentStatus, useCheckin } from '@/data/checkin';
import { colors, statusStyles } from '@/theme';

// Sponsee-facing check-in page. Reached only via a magic link sent by the
// sponsor — never linked from the native app's tab navigation, and requires
// no account or download. Talks to the database only through the
// checkin_get_sponsee / checkin_set_assignment_status RPCs, since sponsees
// have no auth session for RLS to key off of.
export default function SponseeCheckinScreen() {
  const { sponseeId } = useLocalSearchParams<{ sponseeId: string }>();
  const { data, loading, error, refetch } = useCheckin(sponseeId);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggleDone = async (assignmentId: string, current: 'done' | 'pending' | 'overdue') => {
    if (!sponseeId) return;
    await setCheckinAssignmentStatus(sponseeId, assignmentId, current === 'done' ? 'pending' : 'done');
    refetch();
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.page}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.page}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <Text style={styles.notFound}>This link is no longer valid.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const doneCount = data.assignments.filter((a) => a.status === 'done').length;

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Recovery Check-In</Text>
          <Text style={styles.greeting}>Hi {data.name.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>
            Your sponsor set up this page so you can track your recovery worksheets together — no login or app to
            download. Tap a worksheet below once you've completed it, and they'll see your progress.
          </Text>

          <View style={styles.progressRow}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: data.assignments.length ? `${(doneCount / data.assignments.length) * 100}%` : '0%' },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {doneCount}/{data.assignments.length} complete
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {data.assignments.length === 0 && <Text style={styles.emptyText}>No worksheets assigned yet.</Text>}

          {data.assignments.map((a) => {
            const isDone = a.status === 'done';
            const s = statusStyles[a.status];
            return (
              <View key={a.assignmentId} style={[styles.item, isDone && styles.itemDone]}>
                <View style={styles.itemHeader}>
                  <Pressable
                    style={[styles.checkbox, isDone && styles.checkboxChecked]}
                    onPress={() => toggleDone(a.assignmentId, a.status)}
                    hitSlop={8}>
                    {isDone && <Ionicons name="checkmark" size={16} color={colors.surface} />}
                  </Pressable>
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]}>{a.worksheetTitle}</Text>
                    <Text style={styles.itemMeta}>
                      {a.worksheetStep} · due {a.dueDate ?? '—'}
                    </Text>
                  </View>
                  {!isDone && (
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.fg }]}>{s.label}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemDetail}>
                  <Text style={styles.itemPurpose}>{a.worksheetPurpose}</Text>
                  {a.worksheetPrompts.map((p, i) => (
                    <View key={i} style={styles.promptRow}>
                      <Text style={styles.promptNumber}>{i + 1}</Text>
                      <Text style={styles.promptText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.footerNote}>Steady · no account needed</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFound: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center', gap: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.chipInactive, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: colors.done },
  progressText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  list: { gap: 10 },
  emptyText: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  itemDone: { backgroundColor: colors.doneLight, borderColor: colors.done },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.done, borderColor: colors.done },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  itemMeta: { fontSize: 12, color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemDetail: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemPurpose: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  promptRow: { flexDirection: 'row', gap: 8 },
  promptNumber: { fontSize: 13, fontWeight: '700', color: colors.primary, width: 16 },
  promptText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  footerNote: { textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginTop: 8 },
});
