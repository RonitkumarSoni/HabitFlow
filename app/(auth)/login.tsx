import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { BorderRadius, Spacing, Typography } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Please enter your password';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setErrorMessage('');
    setLoading(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View style={styles.brandContainer}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.logoEmoji}>🔥</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>HabitFlow</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Small days, big streaks.
            </Text>
            <Text style={[styles.instruction, { color: colors.textMuted }]}>
              Sign in to pick up where you left off.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="alex@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer switch to Register */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>New here? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: {
    fontSize: 32,
  },
  brandName: {
    fontSize: Typography.size.display,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: Typography.size.lg,
    fontWeight: '600',
    marginBottom: 6,
  },
  instruction: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  footerText: {
    fontSize: Typography.size.md,
  },
  footerLink: {
    fontSize: Typography.size.md,
    fontWeight: '700',
  },
});

