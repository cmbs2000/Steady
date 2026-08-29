import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addRecurringAssignment, removeRecurringAssignment, useRecurringAssignments } from '@/data/recurringAssignments';
import { assignReading, useReadingsForWorksheet } from '@/data/readings';
import { useSelection } from '@/data/selection';
import { useSponsees } from '@/data/sponsees';
import { assignWorksheet, useWorksheet } from '@/data/worksheets';
import { type ThemeColors, useThemeColors } from '@/theme';

function buildWorksheetHtml(title: string, purpose: string, prompts: string[]) {
  const promptItems = prompts
    .map(
      (p, i) => `
      <div class="prompt">
        <p class="prompt-text">${i + 1}. ${p}</p>
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
      </div>`
    )
    .join('');

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 32px; color: #1D2420; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .purpose { color: #5B665F; font-size: 13px; margin-bottom: 24px; }
          .prompt { margin-bottom: 22px; }
          .prompt-text { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
          .line { border-bottom: 1px solid #C7CCC5; height: 26px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="purpose">${purpose}</p>
        ${promptItems}
      </body>
    </html>`;
}

export default function WorksheetDetailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { worksheet, loading, error, refetch } = useWorksheet(id);
  const { readings: attachedReadings, refetch: refetchReadings } = useReadingsForWorksheet(id);
  const { sponsees, refetch: refetchSponsees } = useSponsees();
  const { selectedSponseeId } = useSelection();
  const { recurring, refetch: refetchRecurring } = useRecurringAssignments(selectedSponseeId ?? undefined);
  const [assigning, setAssigning] = useState(false);
  const [togglingRecurring, setTogglingRecurring] = useState(false);
  const [selectedReadingIds, setSelectedReadingIds] = useState<Set<string>>(new Set());

  const toggleReading = (readingId: string) => {
    setSelectedReadingIds((prev) => {
      const next = new Set(prev);
      if (next.has(readingId)) next.delete(readingId);
      else next.add(readingId);
      return next;
    });
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchReadings();
      refetchSponsees();
      refetchRecurring();
    }, [refetch, refetchReadings, refetchSponsees, refetchRecurring])
  );

  const selectedSponsee = sponsees.find((s) => s.id === selectedSponseeId);
  const recurringEntry = recurring.find((r) => r.worksheet_id === id);

  if (loading && !worksheet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !worksheet) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>{error ?? 'Worksheet not found.'}</Text>
      </SafeAreaView>
    );
  }

  const handleAssign = async () => {
    if (!selectedSponsee) return;
    try {
      await assignWorksheet(selectedSponsee.id, worksheet.id);
      await Promise.all(
        Array.from(selectedReadingIds).map((readingId) => assignReading(selectedSponsee.id, readingId))
      );
      setSelectedReadingIds(new Set());
      setAssigning(true);
      setTimeout(() => setAssigning(false), 1600);
    } catch (err) {
      Alert.alert('Could not assign', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleToggleRecurring = async () => {
    if (!selectedSponsee) return;
    setTogglingRecurring(true);
    try {
      if (recurringEntry) {
        await removeRecurringAssignment(recurringEntry.id);
      } else {
        await addRecurringAssignment(selectedSponsee.id, worksheet.id);
      }
      refetchRecurring();
    } catch (err) {
      Alert.alert('Could not update', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setTogglingRecurring(false);
    }
  };

  const handleDownloadPdf = async () => {
    const html = buildWorksheetHtml(worksheet.title, worksheet.purpose, worksheet.prompts);
    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF ready', `Saved to ${uri}`);
      }
    } catch (err) {
      Alert.alert('Could not create PDF', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: worksheet.step,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/worksheet/${worksheet.id}/edit`)} hitSlop={8}>
              <Ionicons name="create-outline" size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{worksheet.step}</Text>
        </View>
        <Text style={styles.title}>{worksheet.title}</Text>

        <Text style={styles.sectionLabel}>Purpose</Text>
        <Text style={styles.purpose}>{worksheet.purpose}</Text>

        <Text style={styles.sectionLabel}>Prompts</Text>
        {worksheet.prompts.map((p, i) => (
          <View key={i} style={styles.promptRow}>
            <Text style={styles.promptNumber}>{i + 1}</Text>
            <Text style={styles.promptText}>{p}</Text>
          </View>
        ))}

        {attachedReadings.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Related Readings</Text>
            <Text style={styles.readingsHint}>Check any to assign alongside this worksheet, as their own assignment.</Text>
            <View style={styles.readingsList}>
              {attachedReadings.map((r) => {
                const checked = selectedReadingIds.has(r.id);
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.readingCard, checked && styles.readingCardChecked]}
                    onPress={() => toggleReading(r.id)}>
                    <View style={styles.readingCardHeader}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Ionicons name="checkmark" size={14} color={colors.surface} />}
                      </View>
                      <View style={styles.readingCardBody}>
                        <Text style={styles.readingSource}>{r.source}</Text>
                        <Text style={styles.readingChapter}>{r.chapter_or_section}</Text>
                      </View>
                    </View>
                    <Text style={styles.readingNote}>{r.sponsor_note}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {selectedSponsee && (
          <Text style={styles.assignHint}>
            Assign to <Text style={styles.assignHintName}>{selectedSponsee.name}</Text>
            {selectedReadingIds.size > 0
              ? ` (+${selectedReadingIds.size} reading${selectedReadingIds.size > 1 ? 's' : ''})`
              : ''}
          </Text>
        )}
        <View style={styles.footerButtons}>
          <Pressable style={styles.secondaryButton} onPress={handleDownloadPdf}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Download fill-in PDF</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, !selectedSponsee && styles.primaryButtonDisabled]}
            onPress={handleAssign}
            disabled={!selectedSponsee}>
            <Ionicons name={assigning ? 'checkmark' : 'add-circle-outline'} size={18} color={colors.surface} />
            <Text style={styles.primaryButtonText}>{assigning ? 'Assigned!' : 'Assign'}</Text>
          </Pressable>
        </View>

        {worksheet.step === 'Daily' && selectedSponsee && (
          <Pressable
            style={[styles.recurringButton, recurringEntry && styles.recurringButtonActive]}
            onPress={handleToggleRecurring}
            disabled={togglingRecurring}>
            <Ionicons
              name={recurringEntry ? 'checkmark-circle' : 'repeat'}
              size={16}
              color={recurringEntry ? colors.done : colors.primary}
            />
            <Text style={[styles.recurringButtonText, recurringEntry && styles.recurringButtonTextActive]}>
              {recurringEntry ? 'Repeating daily — tap to stop' : `Repeat daily for ${selectedSponsee.name}`}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 12, gap: 4 },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  purpose: { fontSize: 15, color: colors.text, lineHeight: 21, marginBottom: 6 },
  promptRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  promptNumber: { fontSize: 14, fontWeight: '700', color: colors.primary, width: 18 },
  promptText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 14, padding: 16, textAlign: 'center' },
  readingsHint: { fontSize: 12, color: colors.textSecondary, marginTop: -4, marginBottom: 8 },
  readingsList: { gap: 10 },
  readingCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readingCardChecked: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  readingCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  readingCardBody: { flex: 1, gap: 2 },
  readingSource: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  readingChapter: { fontSize: 15, fontWeight: '600', color: colors.text },
  readingNote: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  footer: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  assignHint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  assignHintName: { fontWeight: '700', color: colors.text },
  footerButtons: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: colors.surface, fontSize: 13, fontWeight: '700' },
  recurringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
  },
  recurringButtonActive: { backgroundColor: colors.doneLight, borderColor: colors.done },
  recurringButtonText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  recurringButtonTextActive: { color: colors.done },
});
