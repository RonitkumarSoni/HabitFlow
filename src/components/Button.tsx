import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderWidth: 1 };
      case 'danger':
        return { backgroundColor: colors.danger };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1.5 };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'primary':
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'secondary':
      case 'outline':
      case 'ghost':
        return { color: colors.text };
      case 'danger':
      case 'primary':
      default:
        return { color: '#FFFFFF' };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getContainerStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, getTextStyle(), icon ? { marginLeft: Spacing.sm } : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.xl,
  },
  text: {
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.55,
  },
});

