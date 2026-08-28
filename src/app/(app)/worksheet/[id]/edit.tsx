import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorksheetForm } from '@/components/WorksheetForm';
import type { WorksheetInput } from '@/data/worksheets';
import { countAssignmentsForWorksheet, deleteWorksheet, updateWorksheet, useWorksheet } from '@/data/worksheets';
import { type ThemeColors, useThemeColors } from '@/theme';

export default function EditWorksheetScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { worksheet, loading, refetch } = useWorksheet(id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading && !worksheet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!worksheet || !id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Worksheet not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async (input: WorksheetInput) => {
    setSubmitting(true);
    try {
      await updateWorksheet(id, input);
      router.back();
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not save changes', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleDelete = async () => {
    let assignmentCount = 0;
    try {
      assignmentCount = await countAssignmentsForWorksheet(id);
    } catch {
      // fall through with a generic warning if the count check itself fails
    }

    const message =
      assignmentCount > 0
        ? `This worksheet is assigned ${assignmentCount} time${assignmentCount === 1 ? '' : 's'}. Deleting it will also remove those assignments for every sponsee. This can't be undone.`
        : "This can't be undone.";

    Alert.alert('Delete worksheet?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await deleteWorksheet(id);
            router.dismissTo('/library');
          } catch (err) {
            setSubmitting(false);
            Alert.alert('Could not delete worksheet', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Edit Worksheet' }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <WorksheetForm
          initial={worksheet}
          submitting={submitting}
          submitLabel="Save Changes"
          onSubmit={handleSubmit}
        />
        <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={submitting}>
          <Text style={styles.deleteButtonText}>Delete Worksheet</Text>
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
