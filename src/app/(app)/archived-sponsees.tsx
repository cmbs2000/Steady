import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DbSponsee } from '@/data/sponsees';
import { deleteSponsee, restoreSponsee, useSponsees } from '@/data/sponsees';
import { type ThemeColors, useThemeColors } from '@/theme';

export default function ArchivedSponseesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sponsees, loading, error, refetch } = useSponsees({ archived: true });
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRestore = async (sponsee: DbSponsee) => {
    setBusyId(sponsee.id);
    try {
      await restoreSponsee(sponsee.id);
      refetch();
    } catch (err) {
      Alert.alert('Could not restore', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (sponsee: DbSponsee) => {
    Alert.alert(
      'Permanently delete?',
      `This deletes ${sponsee.name} and all of their assignments for good. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setBusyId(sponsee.id);
            try {
              await deleteSponsee(sponsee.id);
              refetch();
            } catch (err) {
              setBusyId(null);
              Alert.alert('Could not delete sponsee', err instanceof Error ? err.message : 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: DbSponsee }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.step}>{item.current_step}</Text>
      </View>
      {busyId === item.id ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.restoreButton} onPress={() => handleRestore(item)} hitSlop={8}>
            <Ionicons name="arrow-undo" size={14} color={colors.primary} />
            <Text style={styles.restoreText}>Restore</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => handleDelete(item)} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.overdue} />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Archived Sponsees' }} />
      {loading && sponsees.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : sponsees.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="archive-outline" size={28} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No archived sponsees.</Text>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 32 },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  listContent: { padding: 16, gap: 10 },
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
  cardBody: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  step: { fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  restoreText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  deleteButton: { padding: 4 },
});
