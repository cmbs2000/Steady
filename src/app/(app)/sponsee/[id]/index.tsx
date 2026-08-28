import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as SMS from 'expo-sms';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { removeRecurringAssignment, useRecurringAssignments } from '@/data/recurringAssignments';
import { useSelection } from '@/data/selection';
import { useSponsee } from '@/data/sponsees';
import { unassignWorksheet, updateAssignmentDueDate } from '@/data/worksheets';
import { getCheckinLink } from '@/lib/links';
import { colors, statusStyles } from '@/theme';

export default function SponseeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { setSelectedSponseeId } = useSelection();
  const { sponsee, loading, error, refetch } = useSponsee(id);
  const { recurring, refetch: refetchRecurring } = useRecurringAssignments(id);
  const [copied, setCopied] = useState(false);
  const [sendingText, setSendingText] = useState(false);
  const [editingDueDateFor, setEditingDueDateFor] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchRecurring();
    }, [refetch, refetchRecurring])
  );

  if (loading && !sponsee) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !sponsee) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{error ?? 'Sponsee not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const doneCount = sponsee.assignments.filter((a) => a.status === 'done').length;
  const magicLink = getCheckinLink(sponsee.id);

  const copyLink = async () => {
    await Clipboard.setStringAsync(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const sendText = async () => {
    if (!sponsee.phone) return;
    setSendingText(true);
    try {
      const available = await SMS.isAvailableAsync();
      if (!available) {
        Alert.alert('Texting not available', 'This device cannot send text messages.');
        return;
      }
      await SMS.sendSMSAsync(
        [sponsee.phone],
        `Hi ${sponsee.name.split(' ')[0]}, here's your Steady check-in link: ${magicLink}`
      );
    } finally {
      setSendingText(false);
    }
  };

  const goAssign = () => {
    setSelectedSponseeId(sponsee.id);
    router.push('/library');
  };

  const removeAssignment = (assignmentId: string, worksheetTitle: string) => {
    Alert.alert('Remove worksheet?', `This removes "${worksheetTitle}" from ${sponsee.name}'s assignments.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await unassignWorksheet(assignmentId);
            refetch();
          } catch (err) {
            Alert.alert('Could not remove', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleDueDateChange = async (assignmentId: string, event: DateTimePickerEvent, date?: Date) => {
    setEditingDueDateFor(null);
    if (event.type !== 'set' || !date) return;
    try {
      await updateAssignmentDueDate(assignmentId, date.toISOString().slice(0, 10));
      refetch();
    } catch (err) {
      Alert.alert('Could not update due date', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const statusIcon = (status: 'pending' | 'done' | 'overdue') => {
    if (status === 'done') return 'checkmark-circle';
    if (status === 'overdue') return 'alert-circle';
    return 'time-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: sponsee.name,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/sponsee/${sponsee.id}/edit`)} hitSlop={8}>
              <Ionicons name="create-outline" size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.name}>{sponsee.name}</Text>
          <Text style={styles.step}>{sponsee.current_step}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="flame" size={16} color={colors.pending} />
              <Text style={styles.summaryText}>{sponsee.streak_days} day streak</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.done} />
              <Text style={styles.summaryText}>
                {doneCount}/{sponsee.assignments.length} complete
              </Text>
            </View>
          </View>
        </View>

        {sponsee.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Private Notes</Text>
            <Text style={styles.notesText}>{sponsee.notes}</Text>
          </View>
        )}

        <Pressable style={styles.linkCard} onPress={copyLink}>
          <Ionicons name="link" size={16} color={colors.primary} />
          <Text style={styles.linkText} numberOfLines={1}>
            {magicLink}
          </Text>
          <Text style={styles.linkAction}>{copied ? 'Copied!' : 'Copy'}</Text>
        </Pressable>

        {sponsee.phone ? (
          <Pressable style={styles.textButton} onPress={sendText} disabled={sendingText}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.surface} />
            <Text style={styles.textButtonText}>{sendingText ? 'Opening Messages…' : `Text link to ${sponsee.phone}`}</Text>
          </Pressable>
        ) : (
          <Text style={styles.noPhoneHint}>Add a phone number to this sponsee to text them the link.</Text>
        )}

        {recurring.length > 0 && (
          <View style={styles.recurringSection}>
            <Text style={styles.sectionTitle}>Repeating Daily</Text>
            {recurring.map((r) => (
              <View key={r.id} style={styles.recurringRow}>
                <Ionicons name="repeat" size={15} color={colors.primary} />
                <Text style={styles.recurringRowText}>{r.worksheet?.title ?? 'Worksheet'}</Text>
                <Pressable
                  onPress={async () => {
                    try {
                      await removeRecurringAssignment(r.id);
                      refetchRecurring();
                    } catch (err) {
                      Alert.alert('Could not stop', err instanceof Error ? err.message : 'Please try again.');
                    }
                  }}
                  hitSlop={8}>
                  <Text style={styles.recurringStopText}>Stop</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Assigned Worksheets</Text>

        {sponsee.assignments.length === 0 && <Text style={styles.emptyText}>No worksheets assigned yet.</Text>}

        {sponsee.assignments.map((a) => {
          if (!a.worksheet) return null;
          const s = statusStyles[a.status];
          return (
            <View key={a.id}>
              <View style={styles.worksheetRow}>
                <View style={styles.worksheetRowMain}>
                  <View style={styles.worksheetRowLeft}>
                    <Pressable onPress={() => router.push(`/worksheet/${a.worksheet!.id}`)}>
                      <Text style={styles.worksheetTitle}>{a.worksheet.title}</Text>
                    </Pressable>
                    <View style={styles.metaRow}>
                      <Text style={styles.worksheetMeta}>{a.worksheet.step} · due </Text>
                      <Pressable onPress={() => setEditingDueDateFor(a.id)} hitSlop={4}>
                        <Text style={styles.dueDateLink}>{a.due_date ?? 'set date'}</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Ionicons name={statusIcon(a.status)} size={13} color={s.fg} />
                    <Text style={[styles.statusText, { color: s.fg }]}>{s.label}</Text>
                  </View>
                </View>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => removeAssignment(a.id, a.worksheet!.title)}
                  hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
              {editingDueDateFor === a.id && (
                <DateTimePicker
                  value={a.due_date ? new Date(`${a.due_date}T00:00:00`) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => handleDueDateChange(a.id, event, date)}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.assignButton} onPress={goAssign}>
          <Ionicons name="add-circle-outline" size={18} color={colors.surface} />
          <Text style={styles.assignButtonText}>Assign a worksheet</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scrollContent: { padding: 16, paddingBottom: 12, gap: 16 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  step: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 18, marginTop: 12 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryText: { fontSize: 13, fontWeight: '500', color: colors.text },
  notesCard: {
    backgroundColor: colors.pendingLight,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  notesLabel: { fontSize: 11, fontWeight: '700', color: colors.pending, textTransform: 'uppercase' },
  notesText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  linkText: { flex: 1, fontSize: 12, color: colors.primary },
  linkAction: { fontSize: 12, fontWeight: '700', color: colors.primary },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  textButtonText: { color: colors.surface, fontSize: 13, fontWeight: '700' },
  noPhoneHint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  recurringSection: { gap: 8 },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recurringRowText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  recurringStopText: { fontSize: 13, fontWeight: '700', color: colors.overdue },
  emptyText: { color: colors.textSecondary, fontSize: 14, padding: 16, textAlign: 'center' },
  worksheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: 10,
  },
  worksheetRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  removeButton: { padding: 6 },
  worksheetRowLeft: { flex: 1, gap: 2 },
  worksheetTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  worksheetMeta: { fontSize: 12, color: colors.textSecondary },
  dueDateLink: { fontSize: 12, color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  assignButtonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
});
