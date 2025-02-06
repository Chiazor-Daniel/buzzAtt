import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

const AvailableClassesScreen = () => {
  // Sample data - replace with actual API data
  const classes = [
    { 
      id: '1', 
      name: 'Software Engineering', 
      code: 'CSC301', 
      lecturer: 'Dr. Smith', 
      schedule: 'Mon, Wed 10:00 AM',
      students: '45/50',
      location: 'Room 401'
    },
    { 
      id: '2', 
      name: 'Database Systems', 
      code: 'CSC405', 
      lecturer: 'Dr. Johnson', 
      schedule: 'Tue, Thu 2:00 PM',
      students: '38/40',
      location: 'Lab 3'
    },
    { 
      id: '3', 
      name: 'Computer Networks', 
      code: 'CSC402', 
      lecturer: 'Prof. Williams', 
      schedule: 'Mon, Fri 1:00 PM',
      students: '42/45',
      location: 'Room 302'
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.classCard}>
      <View style={styles.classHeader}>
        <View>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classCode}>{item.code}</Text>
        </View>
        <View style={styles.studentCount}>
          <Icon name="account-group" size={20} color={THEME.accent} />
          <Text style={styles.studentCountText}>{item.students}</Text>
        </View>
      </View>
      
      <View style={styles.classInfo}>
        <View style={styles.infoItem}>
          <Icon name="account-tie" size={16} color={THEME.textSecondary} />
          <Text style={styles.classDetail}>{item.lecturer}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="clock-outline" size={16} color={THEME.textSecondary} />
          <Text style={styles.classDetail}>{item.schedule}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="map-marker" size={16} color={THEME.textSecondary} />
          <Text style={styles.classDetail}>{item.location}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.enrollButton}>
        <Text style={styles.enrollButtonText}>Enroll Now</Text>
        <Icon name="arrow-right" size={20} color={THEME.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Available Classes</Text>
            <Text style={styles.headerSubtitle}>Find and enroll in new classes</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
  },
  list: {
    padding: 16,
  },
  classCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: THEME.accent,
  },
  studentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${THEME.accent}20`,
    padding: 6,
    borderRadius: 8,
  },
  studentCountText: {
    color: THEME.accent,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  classInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  classDetail: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: 8,
  },
  enrollButton: {
    backgroundColor: THEME.accent,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default AvailableClassesScreen;