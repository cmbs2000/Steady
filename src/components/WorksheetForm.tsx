import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { WorksheetInput } from '@/data/worksheets';
import { STEP_OPTIONS, WORKSHEET_TYPE_OPTIONS } from '@/data/worksheets';
import { type ThemeColors, useThemeColors } from '@/theme';

interface WorksheetFormProps {
  initial?: WorksheetInput;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (input: WorksheetInput) => void;
}

export function WorksheetForm({ initial, submitting, submitLabel, onSubmit }: WorksheetFormProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [step, setStep] = useState(initial?.step ?? STEP_OPTIONS[0]);
  const [type, setType] = useState<string>(initial?.type ?? 'worksheet');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');
  const [prompts, setPrompts] = useState<string[]>(initial?.prompts?.length ? initial.prompts : ['']);

  const updatePrompt = (index: number, value: string) => {
    setPrompts((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const addPrompt = () => setPrompts((prev) => [...prev, '']);
  const removePrompt = (index: number) => setPrompts((prev) => prev.filter((_, i) => i !== index));

  const canSubmit = title.trim() && purpose.trim() && prompts.some((p) => p.trim());

  const handleSubmit = () => {
    onSubmit({
      title: title.trim(),
      step,
      type,
      purpose: purpose.trim(),
      prompts: prompts.map((p) => p.trim()).filter(Boolean),
    });
  };

  return (
    <View style={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Worksheet title"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          editable={!submitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Step</Text>
        <View style={styles.chipRow}>
          {STEP_OPTIONS.map((opt) => {
            const active = opt === step;
            return (
              <Pressable key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => setStep(opt)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          {WORKSHEET_TYPE_OPTIONS.map((opt) => {
            const active = opt === type;
            return (
              <Pressable key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => setType(opt)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Purpose</Text>
        <TextInput
          value={purpose}
          onChangeText={setPurpose}
          placeholder="What this worksheet is for"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.multiline]}
          multiline
          editable={!submitting}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Prompts</Text>
        {prompts.map((prompt, i) => (
          <View key={i} style={styles.promptRow}>
            <TextInput
              value={prompt}
              onChangeText={(v) => updatePrompt(i, v)}
              placeholder={`Prompt ${i + 1}`}
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.promptInput]}
              multiline
              editable={!submitting}
            />
            {prompts.length > 1 && (
              <Pressable onPress={() => removePrompt(i)} style={styles.removePromptButton} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        ))}
        <Pressable style={styles.addPromptButton} onPress={addPrompt}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.addPromptText}>Add prompt</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting || !canSubmit}>
        {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>{submitLabel}</Text>}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  promptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  promptInput: { flex: 1, minHeight: 50, textAlignVertical: 'top' },
  removePromptButton: { paddingTop: 14 },
  addPromptButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  addPromptText: { fontSize: 13, fontWeight: '700', color: colors.primary },
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
