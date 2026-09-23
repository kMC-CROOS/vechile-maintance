import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { CARD_GAP, SECTION_GAP } from './dashboardLayout';
export function SectionHeader({ title, onViewAll, actionLabel = 'View All', compact = false }: { title: string; onViewAll?: () => void; actionLabel?: string; compact?: boolean }) {
  const { theme } = useAppTheme();
  return <View style={[styles.row, compact && { marginTop: 0 }]}>
    <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
    {onViewAll ? <TouchableOpacity onPress={onViewAll} activeOpacity={0.7} style={styles.action}>
      <Text style={styles.link}>{actionLabel} &gt;</Text>
    </TouchableOpacity> : null}
  </View>;
}
const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: CARD_GAP, marginTop: SECTION_GAP, marginBottom: CARD_GAP },
  title: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  action: { flexShrink: 0, paddingVertical: 4 },
  link: { fontSize: 13, fontWeight: '700', color: '#1769FF' },
});
