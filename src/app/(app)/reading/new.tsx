import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadingForm } from '@/components/ReadingForm';
import type { ReadingInput } from '@/data/readings';
import { createReading } from '@/data/readings';
import { type ThemeColors, useThemeColors } from '@/theme';

export default function NewReadingScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: ReadingInput, worksheetIds: string[]) => {
    setSubmitting(true);
    try {
      await createReading(input, worksheetIds);
      router.back();
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Could not create reading', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'New Reading' }} />
      <ScrollView keyboardShouldPersistTaps="handled">
        <ReadingForm submitting={submitting} submitLabel="Create Reading" onSubmit={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
