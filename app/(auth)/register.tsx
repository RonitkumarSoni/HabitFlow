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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const errs: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) {
      errs.name = 'Please enter your name';
    }
    if (!email.trim()) {
      errs.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Please enter a password';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setErrorMessage('');
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
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
          {/* Header */}
          <View style={styles.brandContainer}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.logoEmoji}>🌱</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Start your streak. Build daily momentum.
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
              label="Full Name"
              placeholder="Alex Mercer"
              autoCapitalize="words"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
            />

            <Input
              label="Email Address"
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
              label="Password (min 6 characters)"
              placeholder="Create a strong password"
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
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer switch to Login */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign in</Text>
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
    fontSize: Typography.size.md,
    fontWeight: '500',
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

