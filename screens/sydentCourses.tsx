import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getStudentCourses, enrollInCourse, getAvailableClasses, getSchedules } from '../apis';

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
  const { studentProfile } = useAuthStore();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Fetch enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const courses = await getStudentCourses();
        setEnrolledCourses(courses);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch enrolled courses.');
      }
    };
    fetchEnrolledCourses();
  }, []);

  // Fetch available classes
  useEffect(() => {
    const fetchAvailableClasses = async () => {
      try {
        const classes = await getAvailableClasses();
        setAvailableClasses(classes);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch available classes.');
      }
    };
    fetchAvailableClasses();
  }, []);

  // Fetch schedules for a specific course
  const fetchSchedules = async (classroomId) => {
    try {
      const schedules = await getSchedules(classroomId);
      setSchedules(schedules);
      setSelectedCourseId(classroomId);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch schedules.');
    }
  };

  // Enroll in a course
  const handleEnroll = async (availableClassId) => {
    try {
      const response = await enrollInCourse(availableClassId);
      if (response.is_enrolled) {
        Alert.alert('Success', 'You have successfully enrolled in the course.');
        // Refresh enrolled courses
        const courses = await getStudentCourses();
        setEnrolledCourses(courses);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll in the course.');
    }
  };

  // Render enrolled courses
  const renderEnrolledCourse = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => fetchSchedules(item.id)}
    >
      <Text style={styles.courseName}>{item.name}</Text>
      <Text style={styles.courseDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  // Render available classes
  const renderAvailableClass = ({ item }) => (
    <View style={styles.card}>
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
      <Text style={styles.scheduleText}>Start: {new Date(item.start_time).toLocaleString()}</Text>
      <Text style={styles.scheduleText}>End: {new Date(item.end_time).toLocaleString()}</Text>
      <Text style={styles.scheduleText}>Description: {item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enrolled Courses</Text>
      <FlatList
        data={enrolledCourses}
        renderItem={renderEnrolledCourse}
        keyExtractor={(item) => item.id}
      />

      <Text style={styles.title}>Available Classes</Text>
      <FlatList
        data={availableClasses}
        renderItem={renderAvailableClass}
        keyExtractor={(item) => item.id}
      />

      {selectedCourseId && (
        <>
          <Text style={styles.title}>Schedules for Selected Course</Text>
          <FlatList
            data={schedules}
            renderItem={renderSchedule}
            keyExtractor={(item) => item.id}
          />
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  courseDescription: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 8,
  },
  enrollButton: {
    backgroundColor: THEME.accent,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  enrollButtonText: {
    color: THEME.text,
    fontWeight: '600',
  },
  scheduleText: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
  },
});