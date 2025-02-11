import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getAvailableClasses, getSchedules, enrollInCourse } from '../apis';

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

export function StudentCourseScreen({ navigation }) {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch available classes
  useEffect(() => {
    const fetchAvailableClasses = async () => {
      setLoading(true);
      try {
        const classes = await getAvailableClasses();
        setAvailableClasses(classes);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch available classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableClasses();
  }, []);

  // Fetch schedules for a specific course
  const fetchSchedules = async (classroomId) => {
    setLoading(true);
    try {
      const schedules = await getSchedules(classroomId);
      setSchedules(schedules);
      setSelectedCourseId(classroomId);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch schedules.');
    } finally {
      setLoading(false);
    }
  };

  // Enroll in a course
  const handleEnroll = async (availableClassId) => {
    setLoading(true);
    try {
      const response = await enrollInCourse(availableClassId);
      if (response.is_enrolled) {
        Alert.alert('Success', 'You have successfully enrolled in the course.');
        // Refresh available classes if necessary
        const classes = await getAvailableClasses();
        setAvailableClasses(classes);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll in the course.');
    } finally {
      setLoading(false);
    }
  };

  // Render available classes
  const renderAvailableClass = ({ item }) => (
    <View style={styles.card}>
      <Icon name="school" size={24} color={THEME.accent} />
      <Text style={styles.courseName}>{item.classroom_id}</Text>
      <TouchableOpacity
        style={styles.enrollButton}
        onPress={() => handleEnroll(item.id)}
      >
        <Text style={styles.enrollButtonText}>Enroll</Text>
      </TouchableOpacity>
    </View>
  );

  // Render schedules
  const renderSchedule = ({ item }) => (
    <View style={styles.card}>
      <Icon name="calendar" size={24} color={THEME.accent} />
      <Text style={styles.scheduleText}>Start: {new Date(item.start_time).toLocaleString()}</Text>
      <Text style={styles.scheduleText}>End: {new Date(item.end_time).toLocaleString()}</Text>
      <Text style={styles.scheduleText}>Description: {item.description}</Text>
    </View>
  );

  // Render loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Classes</Text>
      {availableClasses.length > 0 ? (
        <FlatList
          data={availableClasses}
          renderItem={renderAvailableClass}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.noDataText}>No available classes found.</Text>
      )}

      {selectedCourseId && (
        <>
          <Text style={styles.title}>Schedules for Selected Course</Text>
          {schedules.length > 0 ? (
            <FlatList
              data={schedules}
              renderItem={renderSchedule}
              keyExtractor={(item) => item.id}
            />
          ) : (
            <Text style={styles.noDataText}>No schedules found for this course.</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.darker,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16,
    marginTop: 16,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginLeft: 16,
  },
  enrollButton: {
    backgroundColor: THEME.accent,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginLeft: 'auto',
  },
  enrollButtonText: {
    color: THEME.text,
    fontWeight: '600',
  },
  scheduleText: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: 16,
  },
  noDataText: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
