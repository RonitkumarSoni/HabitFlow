import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import { BorderRadius, Spacing, Typography } from '../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonTitle,
  onButtonPress,
  iconName = 'sparkles-outline',
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={iconName} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {buttonTitle && onButtonPress && (
        <Button
          title={buttonTitle}
          onPress={onButtonPress}
          icon={<Ionicons name="add" size={18} color="#FFFFFF" />}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
    maxWidth: 240,
  },
  button: {
    paddingHorizontal: 24,
  },
});

