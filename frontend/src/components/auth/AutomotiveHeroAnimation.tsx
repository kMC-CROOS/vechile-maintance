import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const HERO_HEIGHT = 180;

export const AutomotiveHeroAnimation: React.FC = () => {
  // Animation Values
  const ambientGlow = useRef(new Animated.Value(0)).current;
  const carFade = useRef(new Animated.Value(0)).current;
  const carTranslateY = useRef(new Animated.Value(24)).current;
  const carTranslateX = useRef(new Animated.Value(-12)).current;
  const headlightsOpacity = useRef(new Animated.Value(0)).current;
  const scanPosition = useRef(new Animated.Value(0)).current;
  const scanOpacity = useRef(new Animated.Value(0)).current;
  const techElementsOpacity = useRef(new Animated.Value(0)).current;
  const idleFloat = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    let idleLoop: Animated.CompositeAnimation | null = null;
    let scanLoop: Animated.CompositeAnimation | null = null;

    // 1. Initial Startup Sequence
    Animated.sequence([
      // Step 1: Ambient background glow fades in
      Animated.timing(ambientGlow, {
        toValue: 0.9,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Step 2 & 3: Car fades in and rises + cinematic horizontal settle
      Animated.parallel([
        Animated.timing(carFade, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(carTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(carTranslateX, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
      // Step 4: Headlights softly illuminate
      Animated.timing(headlightsOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Step 5: Diagnostic scan line sweep
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scanOpacity, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(scanPosition, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(scanOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        // Step 6: Tech telemetry indicators reveal
        Animated.timing(techElementsOpacity, {
          toValue: 1,
          duration: 600,
          delay: 400,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    ]).start(() => {
      if (!isMounted) return;

      // Step 7 & 8: Continuous Subtle Idle Animation Loop
      idleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(idleFloat, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(idleFloat, {
            toValue: 0,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      idleLoop.start();

      // Slow periodic diagnostic pulse (every 6 seconds)
      scanLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(4500),
          Animated.timing(scanPosition, {
            toValue: 0,
            duration: 0,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(scanOpacity, {
                toValue: 0.75,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(scanPosition, {
                toValue: 1,
                duration: 1200,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(scanOpacity, {
                toValue: 0,
                duration: 350,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]),
            Animated.sequence([
              Animated.timing(pulseScale, {
                toValue: 1.08,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(pulseScale, {
                toValue: 1,
                duration: 500,
                easing: Easing.in(Easing.quad),
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]),
          ]),
        ])
      );
      scanLoop.start();
    });

    return () => {
      isMounted = false;
      idleLoop?.stop();
      scanLoop?.stop();
    };
  }, []);

  const floatingY = idleFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const scanTranslateX = scanPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [20, HERO_WIDTH - 20],
  });

  const glowBreathing = idleFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. Ambient Background Glow */}
      <Animated.View
        style={[
          styles.ambientGlowContainer,
          {
            opacity: Animated.multiply(ambientGlow, glowBreathing),
          },
        ]}>
        <Svg width={HERO_WIDTH + 80} height={HERO_HEIGHT + 60} viewBox="0 0 440 240">
          <Defs>
            <RadialGradient
              id="heroGlow"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="45%"
              fx="50%"
              fy="50%">
              <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.42" />
              <Stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#0A1220" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="440" height="240" fill="url(#heroGlow)" />
        </Svg>
      </Animated.View>

      {/* 2. Floating Vehicle Silhouette + Tech Elements */}
      <Animated.View
        style={[
          styles.vehicleWrapper,
          {
            opacity: carFade,
            transform: [
              { translateY: Animated.add(carTranslateY, floatingY) },
              { translateX: carTranslateX },
            ],
          },
        ]}>
        {/* Main Vector Automotive Silhouette */}
        <Svg width={HERO_WIDTH} height={HERO_HEIGHT} viewBox="0 0 360 180" fill="none">
          <Defs>
            {/* Body metallic gradient */}
            <LinearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="50%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
              <Stop offset="50%" stopColor="#1E40AF" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
            </LinearGradient>

            {/* Glass roof reflection */}
            <LinearGradient id="glassRoofGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#1E293B" stopOpacity="0.15" />
            </LinearGradient>

            {/* Ground shadow */}
            <RadialGradient id="groundShadow" cx="50%" cy="50%" rx="50%" ry="20%">
              <Stop offset="0%" stopColor="#000000" stopOpacity="0.75" />
              <Stop offset="70%" stopColor="#0284C7" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>

            {/* Neon Headlight Glow */}
            <LinearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="50%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
              <Stop offset="30%" stopColor="#60A5FA" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </LinearGradient>

            {/* Tail light beam */}
            <LinearGradient id="taillightBeam" x1="100%" y1="50%" x2="0%" y2="50%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Ground Contact Shadow */}
          <Rect x="40" y="132" width="280" height="24" fill="url(#groundShadow)" />

          {/* Precision Sleek Sports Vehicle Silhouette Paths */}
          {/* Main Body Aerodynamic Roofline */}
          <Path
            d="M 38 122 
               C 50 120, 68 116, 85 106 
               C 105 94, 130 68, 172 64 
               C 216 60, 248 68, 276 88 
               C 298 103, 314 116, 326 122
               C 334 126, 332 131, 324 133
               C 310 136, 290 136, 275 136
               C 270 120, 252 110, 234 110
               C 216 110, 198 120, 194 136
               L 156 136
               C 152 120, 134 110, 116 110
               C 98 110, 80 120, 76 136
               L 42 136
               C 34 136, 32 124, 38 122 Z"
            fill="url(#carBodyGrad)"
            stroke="#38BDF8"
            strokeWidth="1.2"
          />

          {/* Windshield & Cabin Glass */}
          <Path
            d="M 132 94 
               C 150 75, 174 70, 212 68 
               C 240 68, 260 76, 274 94 
               L 214 94 Z"
            fill="url(#glassRoofGrad)"
            stroke="#60A5FA"
            strokeWidth="0.8"
          />

          {/* Futuristic Shoulder Line Accents */}
          <Path
            d="M 50 114 C 95 108, 195 96, 316 114"
            stroke="#93C5FD"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <Path
            d="M 100 122 C 160 118, 220 118, 260 122"
            stroke="#38BDF8"
            strokeWidth="0.8"
            strokeDasharray="4 4"
          />

          {/* Front Wheel Hub & Caliper */}
          <Circle cx="116" cy="132" r="17" fill="#090D16" stroke="#2563EB" strokeWidth="2.5" />
          <Circle cx="116" cy="132" r="10" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
          <Circle cx="116" cy="132" r="3.5" fill="#60A5FA" />

          {/* Rear Wheel Hub & Caliper */}
          <Circle cx="234" cy="132" r="17" fill="#090D16" stroke="#2563EB" strokeWidth="2.5" />
          <Circle cx="234" cy="132" r="10" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
          <Circle cx="234" cy="132" r="3.5" fill="#60A5FA" />

          {/* Aerodynamic Speed Under-glow Line */}
          <Path
            d="M 20 144 L 340 144"
            stroke="#1E40AF"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <Path
            d="M 80 146 L 280 146"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
        </Svg>

        {/* Headlight Beam Projection (Animated) */}
        <Animated.View
          style={[
            styles.headlightBeamWrap,
            {
              opacity: headlightsOpacity,
            },
          ]}>
          <Svg width={110} height={50} viewBox="0 0 110 50">
            <Path
              d="M 10 20 L 105 2 L 105 46 L 10 28 Z"
              fill="url(#headlightBeam)"
            />
            <Circle cx="12" cy="24" r="3" fill="#E0F2FE" />
          </Svg>
        </Animated.View>

        {/* Rear Taillight Soft Glow (Animated) */}
        <Animated.View
          style={[
            styles.taillightBeamWrap,
            {
              opacity: headlightsOpacity,
            },
          ]}>
          <Svg width={60} height={35} viewBox="0 0 60 35">
            <Path d="M 50 14 L 0 5 L 0 28 L 50 20 Z" fill="url(#taillightBeam)" />
            <Circle cx="48" cy="17" r="2.5" fill="#F87171" />
          </Svg>
        </Animated.View>

        {/* 3. Diagnostic Laser Scanning Line */}
        <Animated.View
          style={[
            styles.scannerLine,
            {
              opacity: scanOpacity,
              transform: [{ translateX: scanTranslateX }],
            },
          ]}>
          <View style={styles.scannerBeam} />
          <View style={styles.scannerDot} />
        </Animated.View>

        {/* 4. Small Automotive Tech & Telemetry Elements */}
        <Animated.View
          style={[
            styles.techContainer,
            {
              opacity: techElementsOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}>
          {/* Diagnostic Badge Left: Engine / Service Status */}
          <View style={styles.telemetryBadgeLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.telemetryKey}>SYSTEM HEALTH</Text>
            <Text style={styles.telemetryVal}>OPTIMAL 100%</Text>
          </View>

          {/* Diagnostic Badge Right: Connected Telemetry */}
          <View style={styles.telemetryBadgeRight}>
            <Text style={styles.telemetryKey}>TELEMETRY</Text>
            <View style={styles.telemetryRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.telemetryVal}>ONLINE</Text>
            </View>
          </View>

          {/* Center Diagnostic Scan Indicator Label */}
          <View style={styles.centerPill}>
            <Text style={styles.centerPillText}>SMART VEHICLE DIAGNOSTICS</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: HERO_HEIGHT + 35,
    marginBottom: 4,
    overflow: 'hidden',
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  vehicleWrapper: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headlightBeamWrap: {
    position: 'absolute',
    right: -12,
    top: 86,
    zIndex: 3,
  },
  taillightBeamWrap: {
    position: 'absolute',
    left: -8,
    top: 92,
    zIndex: 3,
  },
  scannerLine: {
    position: 'absolute',
    top: 45,
    height: 105,
    width: 2,
    zIndex: 5,
  },
  scannerBeam: {
    flex: 1,
    width: 1.8,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
  },
  scannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0F2FE',
    marginLeft: -2.1,
    marginTop: -3,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  techContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 4,
  },
  telemetryBadgeLeft: {
    position: 'absolute',
    top: 8,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(56, 189, 248, 0.28)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backdropFilter: 'blur(4px)',
  },
  telemetryBadgeRight: {
    position: 'absolute',
    top: 8,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(56, 189, 248, 0.28)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'flex-end',
    backdropFilter: 'blur(4px)',
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulseDot: {
    position: 'absolute',
    top: 5,
    left: -4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.success,
  },
  liveIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38BDF8',
  },
  telemetryKey: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3C4',
    letterSpacing: 0.6,
  },
  telemetryVal: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  centerPill: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderColor: 'rgba(56, 189, 248, 0.22)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  centerPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.9,
  },
});
