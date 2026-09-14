import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function DocsTab() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Documents</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.emptyIcon}>📁</Text>
        <Text style={styles.emptyTitle}>Vehicle Documents & Policies</Text>
        <Text style={styles.emptySubtitle}>
          Keep your RC book, Insurance, PUC certificate, and Driving Licence in one secure place.
        </Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/documents' as any)}>
          <Text style={styles.actionBtnText}>Open Documents Vault</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
