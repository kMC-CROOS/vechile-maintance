import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AnimatedPressableCard } from '@/components/ui/AnimatedPressableCard';
import { DashboardIcon, DashboardIconName } from '@/components/dashboard/DashboardIcon';
const entries: { title: string; route: string; icon: DashboardIconName }[] = [
 { title: 'Expenses', route: '/(tabs)/expenses', icon: 'wallet' },
 { title: 'Reports & Analytics', route: '/(tabs)/analytics', icon: 'gauge' },
 { title: 'Reminders & Alerts', route: '/(tabs)/reminders', icon: 'bell' },
 { title: 'Manage Vehicles', route: '/settings/vehicles', icon: 'bike' },
 { title: 'Settings', route: '/settings', icon: 'more' },
];
export default function MoreScreen() {
 const router = useRouter();
 return <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}><ScrollView contentContainerStyle={styles.content}>
  <Text style={styles.heading}>More</Text>
  {entries.map((entry) => <AnimatedPressableCard key={entry.route} onPress={() => router.push(entry.route as any)} style={styles.item}>
   <DashboardIcon name={entry.icon} /><Text style={styles.label}>{entry.title}</Text><DashboardIcon name="chevron" size={18} />
  </AnimatedPressableCard>)}
 </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({page:{flex:1,backgroundColor:'#F5F8FC'},content:{padding:16,paddingBottom:100,gap:12},heading:{fontSize:28,fontWeight:'800',color:'#0B1434',marginBottom:10},item:{flexDirection:'row',alignItems:'center',gap:14,padding:18,borderRadius:20,backgroundColor:'#FFFFFF'},label:{flex:1,fontSize:16,color:'#13294F',fontWeight:'600'}});
