import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSelection } from '@/data/selection';
import { useSponsees } from '@/data/sponsees';
import type { DbWorksheet } from '@/data/worksheets';
import { STEP_OPTIONS, useWorksheets } from '@/data/worksheets';
import { type ThemeColors, useThemeColors } from '@/theme';

const STEP_FILTERS = ['All', ...STEP_OPTIONS];

export default function LibraryScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { worksheets, loading, error, refetch } = useWorksheets();
  const { sponsees, refetch: refetchSponsees } = useSponsees();
  const { selectedSponseeId, setSelectedSponseeId } = useSelection();
  const [query, setQuery] = useState('');
  const [stepFilter, setStepFilter] = useState('All');

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchSponsees();
    }, [refetch, refetchSponsees])
  );

  useEffect(() => {
    if (!selectedSponseeId && sponsees.length > 0) {
      setSelectedSponseeId(sponsees[0].id);
    }
  }, [selectedSponseeId, sponsees, setSelectedSponseeId]);

  const filtered = useMemo(() => {
    return worksheets.filter((w) => {
      const matchesStep = stepFilter === 'All' || w.step === stepFilter;
      const matchesQuery = w.title.toLowerCase().includes(query.trim().toLowerCase());
      return matchesStep && matchesQuery;
    });
  }, [worksheets, stepFilter, query]);

  const renderItem = ({ item }: { item: DbWorksheet }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/worksheet/${item.id}`)}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPurpose} numberOfLines={2}>
          {item.purpose}
        </Text>
      </View>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{item.step}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Worksheet Library</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/worksheet/new')} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.surface} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search worksheets"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={STEP_FILTERS}
        keyExtractor={(s) => s}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const active = item === stepFilter;
          return (
            <Pressable
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStepFilter(item)}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{item}</Text>
            </Pressable>
          );
        }}
      />

      {sponsees.length > 0 && (
        <View style={styles.assignToRow}>
          <Text style={styles.assignToLabel}>Assigning to</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={sponsees}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => {
              const active = item.id === selectedSponseeId;
              return (
                <Pressable
                  style={[styles.sponseeChip, active && styles.sponseeChipActive]}
                  onPress={() => setSelectedSponseeId(item.id)}>
                  <Text style={[styles.sponseeChipText, active && styles.sponseeChipTextActive]}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {loading && worksheets.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No worksheets match your search.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
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
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.chipInactive,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: colors.surface },
  assignToRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  assignToLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  sponseeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sponseeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  sponseeChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  sponseeChipTextActive: { color: colors.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorText: { color: colors.overdue, fontSize: 14, textAlign: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.7 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardPurpose: { fontSize: 12, color: colors.textSecondary },
  stepBadge: { backgroundColor: colors.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
});
