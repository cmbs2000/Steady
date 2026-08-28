import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addSponsee } from '@/data/sponsees';
import { daysSober, sobrietyMilestoneLabel } from '@/lib/sobriety';
import { colors } from '@/theme';

export default function AddSponseeScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sobrietyDate, setSobrietyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && date) setSobrietyDate(date);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setError(null);
    setSubmitting(true);
    try {
      await addSponsee({
        name: trimmedName,
        phone: phone.trim() || null,
        sobrietyDate: sobrietyDate ? sobrietyDate.toISOString().slice(0, 10) : null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add sponsee. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Add Sponsee' }} />
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
          <Text style={styles.label}>Sobriety Date (optional)</Text>
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

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, (submitting || !name.trim()) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !name.trim()}>
          {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Add Sponsee</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  dateText: { fontSize: 15, color: colors.text },
  datePlaceholder: { fontSize: 15, color: colors.textSecondary },
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
});
