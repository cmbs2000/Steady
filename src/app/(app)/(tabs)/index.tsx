import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DbSponsee } from '@/data/sponsees';
import { useSponsees } from '@/data/sponsees';
import { daysSober, sobrietyMilestoneLabel } from '@/lib/sobriety';
import { colors } from '@/theme';

type SortBy = 'name' | 'streak' | 'overdue';

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'streak', label: 'Streak' },
  { key: 'overdue', label: 'Overdue' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { sponsees, loading, error, refetch } = useSponsees();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const visibleSponsees = useMemo(() => {
    const filtered = sponsees.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

    const overdueCountOf = (s: DbSponsee) => s.assignments.filter((a) => a.status === 'overdue').length;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'streak') return b.streak_days - a.streak_days;
      if (sortBy === 'overdue') return overdueCountOf(b) - overdueCountOf(a);
      return a.name.localeCompare(b.name);
    });
  }, [sponsees, query, sortBy]);

  const renderItem = ({ item }: { item: DbSponsee }) => {
    const doneCount = item.assignments.filter((a) => a.status === 'done').length;
    const overdueCount = item.assignments.filter((a) => a.status === 'overdue').length;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => router.push(`/sponsee/${item.id}`)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.step}>
            {item.current_step}
            {item.sobriety_date
              ? ` · ${sobrietyMilestoneLabel(daysSober(item.sobriety_date))} sober`
              : ''}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="flame" size={14} color={colors.pending} />
              <Text style={styles.metaText}>{item.streak_days} day streak</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.done} />
              <Text style={styles.metaText}>
                {doneCount}/{item.assignments.length} complete
              </Text>
            </View>
          </View>
        </View>

        {overdueCount > 0 && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueBadgeText}>{overdueCount}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Sponsees</Text>
          <Text style={styles.subtitle}>{loading ? 'Loading…' : `${sponsees.length} active`}</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-sponsee')} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.surface} />
        </Pressable>
      </View>

      {sponsees.length > 0 && (
        <>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search sponsees"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => {
              const active = opt.key === sortBy;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                  onPress={() => setSortBy(opt.key)}>
                  <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {loading && sponsees.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : sponsees.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No sponsees yet</Text>
          <Text style={styles.emptyText}>Add your first sponsee to get started.</Text>
          <Pressable style={styles.emptyCta} onPress={() => router.push('/add-sponsee')}>
            <Ionicons name="add" size={16} color={colors.surface} />
            <Text style={styles.emptyCtaText}>Add a sponsee</Text>
          </Pressable>
        </View>
      ) : visibleSponsees.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No sponsees match your search.</Text>
        </View>
      ) : (
        <FlatList
          data={visibleSponsees}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  sortLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.chipInactive,
  },
  sortChipActive: { backgroundColor: colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  sortChipTextActive: { color: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 32 },
  errorText: { color: colors.overdue, fontSize: 14, textAlign: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
  },
  emptyCtaText: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.7 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  cardBody: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  step: { fontSize: 13, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  overdueBadge: {
    backgroundColor: colors.overdue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueBadgeText: { color: colors.surface, fontSize: 11, fontWeight: '700' },
});
