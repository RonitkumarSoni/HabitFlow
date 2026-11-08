import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../theme';

interface ProgressRingProps {
  completed: number;
  total: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ completed, total }) => {
  const { colors } = useTheme();

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // SVG Ring dimensions
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  const getMotivationalMessage = () => {
    if (total === 0) return 'Add a habit to start your day';
    if (percentage === 100) return 'All habits completed! Crushing it! 🏆';
    if (percentage >= 70) return 'Almost there, finish strong! 💪';
    if (percentage >= 30) return 'Great momentum, keep going! ✨';
    if (completed > 0) return 'Off to a strong start today 🚀';
    return "Let's build momentum today 🌱";
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Left text */}
      <View style={styles.textColumn}>
        <Text style={[styles.headline, { color: colors.text }]}>
          {completed} of {total} done
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {getMotivationalMessage()}
        </Text>

        {/* Linear progress bar */}
        <View style={[styles.barBackground, { backgroundColor: colors.surfaceSubtle }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: percentage === 100 ? colors.success : colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Right Circular Ring */}
      <View style={styles.ringWrapper}>
        <Svg width={size} height={size}>
          {/* Background circle track */}
          <Circle
            stroke={colors.surfaceSubtle}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Active progress track */}
          <Circle
            stroke={percentage === 100 ? colors.success : colors.primary}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.centerText}>
          <Text style={[styles.percentNumber, { color: colors.text }]}>{percentage}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  textColumn: {
    flex: 1,
    marginRight: Spacing.md,
  },
  headline: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  barBackground: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentNumber: {
    fontSize: Typography.size.md,
    fontWeight: '800',
  },
});

