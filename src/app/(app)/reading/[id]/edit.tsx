import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadingForm } from '@/components/ReadingForm';
import type { ReadingInput } from '@/data/readings';
import {
  deleteReading,
  getBlockingAssignmentsForReading,
  updateReading,
  useReading,
  useWorksheetIdsForReading,
} from '@/data/readings';
import { type ThemeColors, useThemeColors } from '@/theme';

export default function EditReadingScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { reading, loading, refetch } = useReading(id);
  const { worksheetIds, loading: loadingLinks, refetch: refetchLinks } = useWorksheetIdsForReading(id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refetch();
    refetchLinks();
  }, [refetch, refetchLinks]);

  if ((loading || loadingLinks) && !reading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!reading || !id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Reading not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async (input: ReadingInput, selectedWorksheetIds: string[]) => {
    setSubmitting(true);
    try {
      await updateReading(id, input, selectedWorksheetIds);
      router.back();
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not save changes', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleDelete = async () => {
    let blockingSponsees: string[] = [];
    try {
      blockingSponsees = await getBlockingAssignmentsForReading(id);
    } catch (err) {
      Alert.alert('Could not check assignments', err instanceof Error ? err.message : 'Please try again.');
      return;
    }

    if (blockingSponsees.length > 0) {
      Alert.alert(
        'Cannot delete this reading',
        `${blockingSponsees.join(', ')} still ${
          blockingSponsees.length === 1 ? 'has' : 'have'
        } this assigned. Unassign it from ${blockingSponsees.length === 1 ? 'them' : 'everyone'} first, then try again.`
      );
      return;
    }

    Alert.alert('Delete reading?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await deleteReading(id);
            router.dismissTo('/library');
          } catch (err) {
            setSubmitting(false);
            Alert.alert('Could not delete reading', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Edit Reading' }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <ReadingForm
          initial={reading}
          initialWorksheetIds={worksheetIds}
          submitting={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
        <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={submitting}>
          <Text style={styles.deleteButtonText}>Delete Reading</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  deleteButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingBottom: 28 },
  deleteButtonText: { color: colors.overdue, fontSize: 14, fontWeight: '700' },
});
