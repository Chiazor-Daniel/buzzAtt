import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  success: '#4CAF50',
  error: '#F44336',
};

// Dummy attendance history data
const dummyData = [
  {
    id: '1',
    date: '2023-10-01',
    time: '09:00 AM',
    status: 'Present',
  },
  {
    id: '2',
    date: '2023-10-02',
    time: '09:05 AM',
    status: 'Late',
  },
  {
    id: '3',
    date: '2023-10-03',
    time: '09:10 AM',
    status: 'Absent',
  },
  {
    id: '4',
    date: '2023-10-04',
    time: '09:00 AM',
    status: 'Present',
  },
  {
    id: '5',
    date: '2023-10-05',
    time: '09:15 AM',
    status: 'Late',
  },
  {
    id: '6',
    date: '2023-10-06',
    time: '09:00 AM',
    status: 'Present',
  },
];

const HistoryScreen = () => {
  // Render each attendance record
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.date}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'Present'
                  ? THEME.success
                  : item.status === 'Late'
                  ? THEME.warning
                  : THEME.error,
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.time}>
        <Icon name="clock" size={16} color={THEME.textSecondary} /> {item.time}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>
      <FlatList
        data={dummyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records found.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  time: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.textSecondary,
    fontSize: 16,
    marginTop: 24,
  },
});

export default HistoryScreen;