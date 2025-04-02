// components/UIComponents.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeaderProps, StudentRecord } from '../types';

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const getStatusColor = () => {
    if (status.includes('✅')) return '#4CAF50';
    if (status.includes('❌')) return '#F44336';
    if (status.includes('⏳')) return '#FFC107';
    return '#757575';
  };

  return (
    <View style={[styles.statusBar, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

export function StudentListItem({ item }: { item: StudentRecord }) {
  return (
    <View style={styles.studentRecord}>
      <View style={styles.studentIdContainer}>
        <Text style={styles.studentId}>{item.id}</Text>
      </View>
      <View style={styles.studentDetails}>
        <Text style={styles.studentIp}>{item.ip}</Text>
        <Text style={styles.studentTime}>{item.timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 28,
    color: "#fff",
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
    opacity: 0.7,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#fff",
  },
  studentRecord: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studentIdContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  studentId: {
    fontSize: 16,
    fontWeight: '600',
  },
  studentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  studentIp: {
    fontSize: 14,
    marginBottom: 4,
  },
  studentTime: {
    fontSize: 12,
    opacity: 0.7,
  },
});