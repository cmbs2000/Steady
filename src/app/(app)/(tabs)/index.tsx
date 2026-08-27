import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import type { DbSponsee } from '@/data/sponsees';
import { useSponsees } from '@/data/sponsees';
import { colors } from '@/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { sponsees, loading, error, refetch } = useSponsees();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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
          <Text style={styles.step}>{item.current_step}</Text>

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
        <View style={styles.headerActions}>
          <Pressable style={styles.addButton} onPress={() => router.push('/add-sponsee')} hitSlop={8}>
            <Ionicons name="add" size={22} color={colors.surface} />
          </Pressable>
          <Pressable style={styles.signOutButton} onPress={signOut} hitSlop={8}>
            <Ionicons name="log-out-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

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
      ) : (
        <FlatList
          data={sponsees}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  signOutText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
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
