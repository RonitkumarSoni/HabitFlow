import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { HeatmapItem } from '../api/stats';
import { BorderRadius, Spacing, Typography } from '../theme';

interface HeatmapGridProps {
  heatmap: HeatmapItem[];
  habitColor?: string;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ heatmap, habitColor }) => {
  const { colors } = useTheme();
  const activeColor = habitColor || colors.primary;

  // Split into weeks (7 days per column)
  const columns: HeatmapItem[][] = [];
  let currentColumn: HeatmapItem[] = [];

  heatmap.forEach((item, index) => {
    currentColumn.push(item);
    if (currentColumn.length === 7 || index === heatmap.length - 1) {
      columns.push(currentColumn);
      currentColumn = [];
    }
  });

  const totalCompleted = heatmap.filter((h) => h.completed).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>90-Day Activity</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {totalCompleted} check-ins in the last 90 days
          </Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={[styles.legendBox, { backgroundColor: colors.surfaceSubtle }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Missed</Text>
          <View style={[styles.legendBox, { backgroundColor: activeColor, marginLeft: 6 }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Done</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {columns.map((col, colIdx) => (
            <View key={`col-${colIdx}`} style={styles.column}>
              {col.map((item, rowIdx) => (
                <View
                  key={`cell-${colIdx}-${rowIdx}`}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: item.completed ? activeColor : colors.surfaceSubtle,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  scrollContent: {
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flexDirection: 'column',
    gap: 4,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});

