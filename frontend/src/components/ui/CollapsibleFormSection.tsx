import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';
import { MinTouchTarget } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  if (!(globalThis as any).nativeFabricUIManager) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export interface CollapsibleFormSectionProps {
  title: string;
  subtitle?: string;
  completedCount?: number;
  totalCount?: number;
  initiallyExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  showCompletedTick?: boolean;
  showSkip?: boolean;
  showNext?: boolean;
  onSkip?: () => void;
  onNext?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ChevronIcon = ({ expanded, color }: { expanded: boolean; color: string }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CompletedTickIcon = ({ color, checkColor }: { color: string; checkColor: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" accessibilityLabel="Section completed">
    <Circle cx="12" cy="12" r="11" fill={color} />
    <Path d="M7.5 12.2l3 3 6-6.4" stroke={checkColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CollapsibleFormSection: React.FC<CollapsibleFormSectionProps> = ({
  title,
  subtitle,
  completedCount,
  totalCount,
  initiallyExpanded = false,
  expanded: expandedProp,
  onExpandedChange,
  showCompletedTick = false,
  showSkip = false,
  showNext = false,
  onSkip,
  onNext,
  icon,
  children,
}) => {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const stackFooter = width < 360;
  const [internalExpanded, setInternalExpanded] = useState(initiallyExpanded);
  const isControlled = expandedProp !== undefined;
  const expanded = isControlled ? expandedProp : internalExpanded;

  const setExpanded = (next: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!isControlled) setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  const toggleExpand = () => setExpanded(!expanded);

  const isAllComplete = Boolean(totalCount && completedCount !== undefined && completedCount >= totalCount);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: expanded ? theme.blueDim : theme.border,
        },
      ]}>
      <TouchableOpacity
        style={styles.headerRow}
        activeOpacity={0.7}
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${title} section, ${expanded ? 'expanded' : 'collapsed'}`}>
        <View style={styles.headerLeft}>
          {icon ? (
            <View style={[styles.iconCircle, { backgroundColor: theme.blueSoft }]}>{icon}</View>
          ) : null}
          <View style={styles.headerTextWrap}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, { color: theme.textPrimary }]} numberOfLines={2}>
                {title}
              </Text>
              {totalCount !== undefined && completedCount !== undefined ? (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isAllComplete ? theme.successBg : theme.iconBg },
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isAllComplete ? theme.success : theme.textMuted },
                    ]}>
                    {completedCount}/{totalCount}
                  </Text>
                </View>
              ) : null}
            </View>
            {subtitle ? (
              <Text style={[styles.subtitleText, { color: theme.textMuted }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerRight}>
          {showCompletedTick ? (
            <View accessibilityLabel="Section completed">
              <CompletedTickIcon color={theme.success} checkColor={theme.onSuccess} />
            </View>
          ) : null}
          <View style={[styles.chevronBox, { backgroundColor: theme.surface2 }]}>
            <ChevronIcon expanded={expanded} color={expanded ? theme.primaryBlue : theme.textMuted} />
          </View>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={[styles.contentBody, { borderTopColor: theme.borderSoft }]}>
          {children}

          {showSkip || showNext ? (
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <View style={[styles.footerRow, stackFooter && styles.footerCol]}>
                {showNext ? (
                  <TouchableOpacity
                    style={[
                      styles.footerBtn,
                      styles.nextBtn,
                      { borderColor: theme.primaryBlue },
                      stackFooter && styles.footerBtnFull,
                    ]}
                    activeOpacity={0.75}
                    onPress={onNext}
                    accessibilityRole="button"
                    accessibilityLabel="Next section">
                    <Text
                      style={[styles.footerBtnText, { color: theme.primaryBlue }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}>
                      Next section
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {showSkip ? (
                  <TouchableOpacity
                    style={[
                      styles.footerBtn,
                      showNext ? styles.skipBtnBeside : styles.skipBtnFull,
                      stackFooter && styles.footerBtnFull,
                    ]}
                    activeOpacity={0.75}
                    onPress={onSkip}
                    accessibilityRole="button"
                    accessibilityLabel="Skip for now">
                    <Text
                      style={[styles.footerBtnText, { color: theme.primaryBlue }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}>
                      Skip for now
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 6,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
    borderTopWidth: 1,
  },
  footer: {
    marginTop: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  footerCol: {
    flexDirection: 'column',
  },
  footerBtn: {
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  footerBtnFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  nextBtn: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  skipBtnFull: {
    flex: 1,
    width: '100%',
  },
  skipBtnBeside: {
    flex: 1,
    minWidth: 0,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
