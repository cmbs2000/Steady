import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WorksheetForm } from '@/components/WorksheetForm';
import type { WorksheetInput } from '@/data/worksheets';
import { createWorksheet } from '@/data/worksheets';
import { type ThemeColors, useThemeColors } from '@/theme';

export default function NewWorksheetScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: WorksheetInput) => {
    setSubmitting(true);
    try {
      await createWorksheet(input);
      router.back();
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not create worksheet', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'New Worksheet' }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <WorksheetForm submitting={submitting} submitLabel="Create Worksheet" onSubmit={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
