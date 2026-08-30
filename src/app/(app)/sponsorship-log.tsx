import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SponsorshipLogEntry } from '@/data/sponsees';
import { useSponsorshipLog } from '@/data/sponsees';
import { type ThemeColors, useThemeColors } from '@/theme';

function formatMonthYear(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function SponsorshipLogScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { entries, loading, error, refetch } = useSponsorshipLog();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const totalEver = entries.length;
  const reachedStep12 = entries.filter((e) => e.current_step === 'Step 12').length;

  const renderItem = ({ item }: { item: SponsorshipLogEntry }) => (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.dateRange}>
          {formatMonthYear(item.created_at)} – {item.archived_at ? formatMonthYear(item.archived_at) : 'Ongoing'}
        </Text>
      </View>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{item.current_step}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Sponsorship Log' }} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalEver}</Text>
          <Text style={styles.summaryLabel}>Sponsees Ever</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{reachedStep12}</Text>
          <Text style={styles.summaryLabel}>Reached Step 12</Text>
        </View>
      </View>

      {loading && entries.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No sponsees yet.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorText: { color: colors.overdue, fontSize: 14, textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowMain: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  dateRange: { fontSize: 13, color: colors.textSecondary },
  stepBadge: { backgroundColor: colors.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
});
