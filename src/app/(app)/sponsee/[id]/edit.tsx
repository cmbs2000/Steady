import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { archiveSponsee, updateSponsee, useSponsee } from '@/data/sponsees';
import { daysSober, sobrietyMilestoneLabel } from '@/lib/sobriety';
import { type ThemeColors, useThemeColors } from '@/theme';

const STEP_OPTIONS = Array.from({ length: 12 }, (_, i) => `Step ${i + 1}`);

export default function EditSponseeScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sponsee, loading: loadingSponsee, refetch } = useSponsee(id);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentStep, setCurrentStep] = useState('Step 1');
  const [notes, setNotes] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (sponsee) {
      setName(sponsee.name);
      setPhone(sponsee.phone ?? '');
      setCurrentStep(sponsee.current_step);
      setNotes(sponsee.notes ?? '');
      setSobrietyDate(sponsee.sobriety_date ? new Date(`${sponsee.sobriety_date}T00:00:00`) : null);
    }
  }, [sponsee]);

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && date) setSobrietyDate(date);
  };

  if (loadingSponsee && !sponsee) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!id) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setError(null);
    setSubmitting(true);
    try {
      await updateSponsee(id, {
        name: trimmedName,
        phone: phone.trim() || null,
        current_step: currentStep,
        notes: notes.trim() || null,
        sobriety_date: sobrietyDate ? sobrietyDate.toISOString().slice(0, 10) : null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = () => {
    if (!id) return;
    Alert.alert(
      'Archive sponsee?',
      `${sponsee?.name ?? 'This sponsee'} will be hidden from your dashboard. You can restore them anytime from Archived Sponsees.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await archiveSponsee(id);
              router.replace('/');
            } catch (err) {
              setSubmitting(false);
              Alert.alert('Could not archive sponsee', err instanceof Error ? err.message : 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Edit Sponsee' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            editable={!submitting}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 555-5555"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            style={styles.input}
            editable={!submitting}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Current Step</Text>
          <View style={styles.chipRow}>
            {STEP_OPTIONS.map((step) => {
              const active = step === currentStep;
              return (
                <Pressable
                  key={step}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCurrentStep(step)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{step}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sobriety Date</Text>
          <Pressable style={styles.input} onPress={() => setShowDatePicker(true)} disabled={submitting}>
            <Text style={sobrietyDate ? styles.dateText : styles.datePlaceholder}>
              {sobrietyDate
                ? `${sobrietyDate.toLocaleDateString()} · ${sobrietyMilestoneLabel(daysSober(sobrietyDate.toISOString().slice(0, 10)))}`
                : 'Tap to set'}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={sobrietyDate ?? new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Private Notes (only you see this)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything you want to remember between check-ins"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.notesInput]}
            multiline
            editable={!submitting}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, (submitting || !name.trim()) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={submitting || !name.trim()}>
          {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleArchive} disabled={submitting}>
          <Text style={styles.deleteButtonText}>Archive Sponsee</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  notesInput: { minHeight: 90, textAlignVertical: 'top' },
  dateText: { fontSize: 15, color: colors.text },
  datePlaceholder: { fontSize: 15, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  error: { color: colors.overdue, fontSize: 13 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  deleteButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  deleteButtonText: { color: colors.overdue, fontSize: 14, fontWeight: '700' },
});
