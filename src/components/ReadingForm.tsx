import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ReadingInput } from '@/data/readings';
import { useReadingSources } from '@/data/readings';
import { STEP_OPTIONS, useWorksheets } from '@/data/worksheets';
import { type ThemeColors, useThemeColors } from '@/theme';

interface ReadingFormProps {
  initial?: ReadingInput;
  initialWorksheetIds?: string[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (input: ReadingInput, worksheetIds: string[]) => void;
}

export function ReadingForm({ initial, initialWorksheetIds, submitting, submitLabel, onSubmit }: ReadingFormProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { sources, refetch: refetchSources } = useReadingSources();
  const { worksheets, refetch: refetchWorksheets } = useWorksheets();
  const [chapterOrSection, setChapterOrSection] = useState(initial?.chapter_or_section ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [stepOrTheme, setStepOrTheme] = useState(initial?.step_or_theme ?? STEP_OPTIONS[0]);
  const [sponsorNote, setSponsorNote] = useState(initial?.sponsor_note ?? '');
  const [selectedWorksheetIds, setSelectedWorksheetIds] = useState<Set<string>>(new Set(initialWorksheetIds ?? []));

  useEffect(() => {
    refetchSources();
    refetchWorksheets();
  }, [refetchSources, refetchWorksheets]);

  useEffect(() => {
    setSelectedWorksheetIds(new Set(initialWorksheetIds ?? []));
  }, [initialWorksheetIds]);

  const toggleWorksheet = (worksheetId: string) => {
    setSelectedWorksheetIds((prev) => {
      const next = new Set(prev);
      if (next.has(worksheetId)) next.delete(worksheetId);
      else next.add(worksheetId);
      return next;
    });
  };

  const suggestedSources = sources.filter((s) => s !== source);
  const canSubmit = chapterOrSection.trim() && source.trim();

  const handleSubmit = () => {
    onSubmit(
      {
        source: source.trim(),
        chapter_or_section: chapterOrSection.trim(),
        step_or_theme: stepOrTheme,
        sponsor_note: sponsorNote.trim() || null,
      },
      Array.from(selectedWorksheetIds)
    );
  };

  return (
    <View style={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Chapter or Section</Text>
        <TextInput
          value={chapterOrSection}
          onChangeText={setChapterOrSection}
          placeholder="e.g. How It Works"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          editable={!submitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Source</Text>
        <TextInput
          value={source}
          onChangeText={setSource}
          placeholder="e.g. Big Book"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          editable={!submitting}
        />
        {suggestedSources.length > 0 && (
          <View style={styles.chipRow}>
            {suggestedSources.map((s) => (
              <Pressable key={s} style={styles.chip} onPress={() => setSource(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Step / Theme</Text>
        <View style={styles.chipRow}>
          {STEP_OPTIONS.map((opt) => {
            const active = opt === stepOrTheme;
            return (
              <Pressable
                key={opt}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStepOrTheme(opt)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Sponsor Note (optional)</Text>
        <TextInput
          value={sponsorNote}
          onChangeText={setSponsorNote}
          placeholder="When might a sponsor assign this?"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.multiline]}
          multiline
          editable={!submitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Attached Worksheets</Text>
        <Text style={styles.hint}>Select any worksheets this reading should show up on.</Text>
        <View style={styles.worksheetList}>
          {worksheets.map((w) => {
            const checked = selectedWorksheetIds.has(w.id);
            return (
              <Pressable
                key={w.id}
                style={[styles.worksheetRow, checked && styles.worksheetRowChecked]}
                onPress={() => toggleWorksheet(w.id)}
                disabled={submitting}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Ionicons name="checkmark" size={14} color={colors.surface} />}
                </View>
                <View style={styles.worksheetRowBody}>
                  <Text style={styles.worksheetRowTitle}>{w.title}</Text>
                  <Text style={styles.worksheetRowStep}>{w.step}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || !canSubmit}>
        {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>{submitLabel}</Text>}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { padding: 20, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: -2 },
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
  multiline: { minHeight: 70, textAlignVertical: 'top' },
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
  worksheetList: { gap: 8, marginTop: 2 },
  worksheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  worksheetRowChecked: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  worksheetRowBody: { flex: 1, gap: 1 },
  worksheetRowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  worksheetRowStep: { fontSize: 12, color: colors.textSecondary },
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
