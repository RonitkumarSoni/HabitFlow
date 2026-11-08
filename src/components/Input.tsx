import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  isPassword = false,
  leftIcon,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : isFocused ? colors.primary : colors.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.md,
    height: '100%',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.size.xs,
    marginTop: 4,
    fontWeight: '500',
  },
});

