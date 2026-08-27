import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme';

export default function SignInScreen() {
  const { session, loading, sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) {
    return <Redirect href="/" />;
  }

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setError(null);
    setSubmitting(true);
    try {
      await sendCode(trimmed);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setSubmitting(true);
    try {
      await verifyCode(email.trim(), trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn\'t work. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>Steady</Text>
          <Text style={styles.title}>Sponsor sign in</Text>

          {step === 'email' ? (
            <>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a one-time code — no password needed.
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
                editable={!submitting}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={[styles.button, (submitting || !email.trim()) && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={submitting || !email.trim()}>
                {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Send code</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                We sent a code to {email.trim()}. Enter it below to sign in.
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter code"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                style={[styles.input, styles.codeInput]}
                editable={!submitting}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={[styles.button, (submitting || !code.trim()) && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={submitting || !code.trim()}>
                {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonText}>Verify & sign in</Text>}
              </Pressable>

              <Pressable
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
                disabled={submitting}>
                <Text style={styles.resendLink}>Use a different email</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 6 },
  eyebrow: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  codeInput: { textAlign: 'center', fontSize: 22, fontWeight: '700', letterSpacing: 6 },
  error: { color: colors.overdue, fontSize: 13, marginBottom: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  resendLink: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 16, textAlign: 'center' },
});
