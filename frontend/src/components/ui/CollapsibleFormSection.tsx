import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface CollapsibleFormSectionProps {
  title: string;
  subtitle?: string;
  completedCount?: number;
  totalCount?: number;
  initiallyExpanded?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ChevronIcon = ({ expanded, color = '#6B7280' }: { expanded: boolean; color?: string }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CollapsibleFormSection: React.FC<CollapsibleFormSectionProps> = ({
  title,
  subtitle,
  completedCount,
  totalCount,
  initiallyExpanded = false,
  icon,
  children,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isAllComplete = Boolean(totalCount && completedCount !== undefined && completedCount >= totalCount);

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      {/* Accordion Header */}
      <TouchableOpacity
        style={styles.headerRow}
        activeOpacity={0.7}
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${title} section, ${expanded ? 'expanded' : 'collapsed'}`}>
        <View style={styles.headerLeft}>
          {icon ? <View style={styles.iconCircle}>{icon}</View> : null}
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>{title}</Text>
              {totalCount !== undefined && completedCount !== undefined ? (
                <View style={[styles.statusBadge, isAllComplete && styles.statusBadgeComplete]}>
                  <Text style={[styles.statusBadgeText, isAllComplete && styles.statusBadgeTextComplete]}>
                    {completedCount}/{totalCount} {isAllComplete ? '✓' : ''}
                  </Text>
                </View>
              ) : null}
            </View>
            {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.chevronBox}>
          <ChevronIcon expanded={expanded} color={expanded ? '#2563EB' : '#6B7280'} />
        </View>
      </TouchableOpacity>

      {/* Accordion Content */}
      {expanded ? <View style={styles.contentBody}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    marginVertical: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardExpanded: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  statusBadgeComplete: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },
  statusBadgeTextComplete: {
    color: '#16A34A',
  },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
