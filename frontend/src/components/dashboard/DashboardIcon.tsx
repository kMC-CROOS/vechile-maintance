import type { ColorValue } from 'react-native';
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
export type DashboardIconName = 'home' | 'fuel' | 'service' | 'document' | 'more' | 'shield' | 'leaf' | 'gauge' | 'wallet' | 'bell' | 'chevron' | 'bike';
const paths: Record<DashboardIconName, string> = {
 home: 'M3 10L12 3l9 7M5 9v12h5v-7h4v7h5V9',
 fuel: 'M3 21V4h10v17M3 10h10M2 21h12M13 7h3l4 4v8a2 2 0 0 1-4 0v-5h-3M17 8v4h3',
 service: 'M14 3a6 6 0 0 0-7 8L2 17a3 3 0 0 0 4 4l6-6a6 6 0 0 0 8-7l-4 4-4-4 4-4z',
 document: 'M6 2h8l5 5v15H6zM14 2v6h5M9 12h7M9 16h7',
 more: 'M4 12h.01M12 12h.01M20 12h.01',
 shield: 'M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6zM8 12l3 3 5-6',
 leaf: 'M20 3C5 2 1 10 6 17s15 0 14-14zM5 21L16 9',
 gauge: 'M4 19a10 10 0 1 1 16 0M12 13l5-5M4 12h2M18 12h2M12 3v3',
 wallet: 'M3 7V4l13-2v5M3 7h18v14H3zM16 12h5v5h-5z',
 bell: 'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 21h4M3 5l-1 3M21 5l1 3',
 chevron: 'M9 5l7 7-7 7',
 bike: 'M3 16a4 4 0 1 0 8 0 4 4 0 1 0-8 0M15 16a4 4 0 1 0 8 0 4 4 0 1 0-8 0M7 16l4-8 8 8M10 8h7l-2-4h-3M11 8l3 8H7',
};
export function DashboardIcon({ name, color = '#1769FF', size = 24 }: { name: DashboardIconName; color?: ColorValue; size?: number }) {
 return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d={paths[name]} stroke={color} strokeWidth={name === 'more' ? 4 : 2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
