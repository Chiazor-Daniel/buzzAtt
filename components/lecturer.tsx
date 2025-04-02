import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Modal, Button, Animated, StyleSheet    } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getCourses, getAttendance, getStudents, getLecturerSchedules, createSchedule, updateSchedule } from '../apis';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { StatusBadge } from './utils';

const LecturerDashboard = ({ navigation }) => {
  const { lecturerProfile } = useAuthStore();
  const [lecturerCourses, setLecturerCourses] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState({ course_id: '', schedule: [] });
  const isMounted = useRef(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchLecturerData = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const lecturerId = lecturerProfile?.id;
      if (lecturerId) {
        const coursesData = await getCourses(lecturerId);
        const schedulesData = await getLecturerSchedules(lecturerId);
        
        if (isMounted.current) {
          const validCoursesData = Array.isArray(coursesData) ? coursesData : [];
          setLecturerCourses(validCoursesData);
          setSchedules(schedulesData || []);
          
          // If there are courses, fetch attendance for the first one
          if (validCoursesData.length > 0) {
            setSelectedCourse(validCoursesData[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lecturer data:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load courses. Please try again later.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchAttendance = async (courseId) => {
    if (!courseId || !isMounted.current) return;
    
    setLoadingAttendance(true);
    try {
      const attendanceData = await getAttendance(courseId);
      
      if (isMounted.current) {
        setAttendanceData(Array.isArray(attendanceData) ? attendanceData : []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load attendance data.');
      }
    } finally {
      if (isMounted.current) {
        setLoadingAttendance(false);
      }
    }
  };

  useEffect(() => {
    fetchLecturerData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendance(selectedCourse.classroom_id);
    }
  }, [selectedCourse]);

  const handleClassSelect = (classItem) => {
    if (!classItem) return;
    setSelectedCourse(classItem);
    fetchAttendance(classItem.classroom_id);
  };

  const handleViewStudentAttendance = (studentId) => {
    if (!studentId || !selectedCourse) return;
    
    navigation.navigate('StudentAttendance', { 
      studentId, 
      courseId: selectedCourse?.classroom_id,
      courseName: selectedCourse?.title || selectedCourse?.description || 'Course'
    });
  };

  const handleTakeAttendance = () => {
    if (selectedCourse) {
      navigation.navigate('Lecturer', { courseData: selectedCourse });
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleData.course_id || !scheduleData.schedule.length) return;
    
    try {
      await createSchedule(scheduleData);
      Alert.alert('Success', 'Schedule created successfully.');
      setIsScheduleModalVisible(false);
      fetchLecturerData();
    } catch (error) {
      console.error('Error creating schedule:', error);
      Alert.alert('Error', 'Failed to create schedule. Please try again.');
    }
  };

  const handleUpdateSchedule = async (scheduleId) => {
    if (!scheduleId || !scheduleData.schedule.length) return;
    
    try {
      await updateSchedule(scheduleId, scheduleData);
      Alert.alert('Success', 'Schedule updated successfully.');
      setIsScheduleModalVisible(false);
      fetchLecturerData();
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update schedule. Please try again.');
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.courseItem}
      onPress={() => setScheduleData({ ...scheduleData, course_id: item.id })}
    >
      <Text style={styles.courseItemText}>{item.name || item.description || 'Untitled Course'}</Text>
    </TouchableOpacity>
  );

  const renderLecturerCourseCard = (item) => (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.classCard,
          selectedCourse?.id === item.id && styles.selectedClassCard,
        ]}
        onPress={() => handleClassSelect(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.classCardContent}>
          <View style={styles.classIconContainer}>
            <Icon name="book-open-variant" size={24} color={THEME.accent} />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{item.title || item.description || 'Untitled Course'}</Text>
            <Text style={styles.classSubtitle}>{item.description || 'No description'}</Text>
            <Text style={styles.classStudents}>
              <Icon name="account-group" size={14} color={THEME.textSecondary} /> {item.student_count || 0} students
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderAttendanceRecord = ({ item, index }) => {
    if (!item) return null;
    
    const studentId = item.student_id || '';
    const attendancePercentage = item.attendance_count / (item.attendance_count + item.absence_count) * 100;
    
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={[
            styles.attendanceCard,
            { borderLeftColor: attendancePercentage >= 75 ? THEME.success : attendancePercentage >= 50 ? THEME.warning : THEME.error }
          ]}
          onPress={() => studentId ? handleViewStudentAttendance(studentId) : null}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.attendanceCardContent}>
            <View style={styles.studentIconContainer}>
              <Icon name="account" size={24} color={THEME.text} />
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.student_name || 'Student'}</Text>
              <Text style={styles.studentId}>{studentId || 'ID unavailable'}</Text>
              <View style={styles.attendanceProgress}>
                <View style={[styles.progressBar, { width: `${attendancePercentage}%` }]} />
                <Text style={styles.progressText}>{Math.round(attendancePercentage)}% attendance</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.attendanceStats}>
            <View style={styles.attendanceStat}>
              <Text style={styles.attendanceStatValue}>{item.attendance_count || 0}</Text>
              <Text style={styles.attendanceStatLabel}>Present</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={styles.attendanceStatValue}>{item.absence_count || 0}</Text>
              <Text style={styles.attendanceStatLabel}>Absent</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderLecturerEmptyState = (type) => (
    <View style={styles.emptyContainer}>
      <Icon 
        name={type === 'courses' ? "book-remove" : "account-group"} 
        size={64} 
        color={THEME.textSecondary} 
      />
      <Text style={styles.emptyTitle}>
        {type === 'courses' ? "No Courses Assigned" : "No Attendance Data"}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'courses' 
          ? "You don't have any courses assigned to you at the moment." 
          : "No attendance records found for this course."}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.lecturerHeaderContainer}>
        <View>
          <Text style={styles.lecturerSectionTitle}>My Courses</Text>
          <Text style={styles.lecturerSubtitle}>Select a course to view attendance</Text>
        </View>
        {selectedCourse && (
          <TouchableOpacity 
            style={styles.takeAttendanceButton}
            onPress={handleTakeAttendance}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Icon name="clipboard-check" size={16} color={THEME.text} />
            <Text style={styles.takeAttendanceText}>Take Attendance</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={styles.loaderText}>Loading courses...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={lecturerCourses}
            keyExtractor={(item, index) => `course-${item?.id || index}`}
            horizontal
            contentContainerStyle={styles.courseListContainer}
            renderItem={({ item }) => renderLecturerCourseCard(item)}
            ListEmptyComponent={() => renderLecturerEmptyState('courses')}
            showsHorizontalScrollIndicator={false}
            refreshing={loading}
            onRefresh={fetchLecturerData}
          />

          {selectedCourse ? (
            <>
              <View style={styles.attendanceHeaderContainer}>
                <View>
                  <Text style={styles.attendanceSectionTitle}>
                    Attendance for {selectedCourse.title || selectedCourse.description || 'Course'}
                  </Text>
                  <Text style={styles.attendanceSubtitle}>
                    {attendanceData.length} students registered
                  </Text>
                </View>
              </View>

              {loadingAttendance ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={THEME.accent} />
                  <Text style={styles.loaderText}>Loading attendance data...</Text>
                </View>
              ) : (
                <FlatList
                  data={attendanceData}
                  keyExtractor={(item, index) => `attendance-${index}-${item?.student_id || 'unknown'}`}
                  contentContainerStyle={styles.attendanceListContainer}
                  renderItem={renderAttendanceRecord}
                  ListEmptyComponent={() => renderLecturerEmptyState('attendance')}
                  refreshing={loadingAttendance}
                  onRefresh={() => fetchAttendance(selectedCourse.classroom_id)}
                />
              )}
            </>
          ) : null}
        </>
      )}
<Modal
  visible={isScheduleModalVisible}
  onRequestClose={() => setIsScheduleModalVisible(false)}
  animationType="slide"
  transparent={true}
>
  <View style={styles.modalContainer}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Text style={styles.modalTitle}>Create/Update Schedule</Text>
      <TouchableOpacity onPress={() => setIsScheduleModalVisible(false)}>
        <Icon name="close" size={24} color={THEME.text} />
      </TouchableOpacity>
    </View>
    
    <Text style={{ color: THEME.text, fontSize: 16, marginBottom: 12, fontWeight: '600' }}>Select Course:</Text>
    <FlatList
      data={lecturerCourses}
      keyExtractor={(item, index) => `course-${item?.id || index}`}
      renderItem={renderCourseItem}
      ListEmptyComponent={() => (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Icon name="information-outline" size={32} color={THEME.textSecondary} />
          <Text style={styles.emptyText}>No courses available</Text>
        </View>
      )}
      style={{ maxHeight: 200, marginBottom: 16 }}
    />
    
    <Text style={{ color: THEME.text, fontSize: 16, marginBottom: 8, fontWeight: '600' }}>Schedule Details:</Text>
    <View style={{ marginBottom: 24 }}>
      <TextInput
        style={styles.input}
        placeholder="Day"
        placeholderTextColor={THEME.textSecondary}
        value={scheduleData.schedule[0]?.day || ''}
        onChangeText={(text) => setScheduleData({ ...scheduleData, schedule: [{ ...scheduleData.schedule[0] || {}, day: text }] })}
      />
      <TextInput
        style={styles.input}
        placeholder="Start Time"
        placeholderTextColor={THEME.textSecondary}
        value={scheduleData.schedule[0]?.start_time || ''}
        onChangeText={(text) => setScheduleData({ ...scheduleData, schedule: [{ ...scheduleData.schedule[0] || {}, start_time: text }] })}
      />
      <TextInput
        style={styles.input}
        placeholder="End Time"
        placeholderTextColor={THEME.textSecondary}
        value={scheduleData.schedule[0]?.end_time || ''}
        onChangeText={(text) => setScheduleData({ ...scheduleData, schedule: [{ ...scheduleData.schedule[0] || {}, end_time: text }] })}
      />
    </View>
    
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <TouchableOpacity 
        style={{ 
          backgroundColor: THEME.accent, 
          paddingVertical: 14, 
          paddingHorizontal: 20, 
          borderRadius: 8, 
          flex: 1, 
          marginRight: 8,
          alignItems: 'center',
        }} 
        onPress={handleCreateSchedule}
      >
        <Text style={{ color: THEME.text, fontWeight: 'bold', fontSize: 16 }}>Create</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          paddingVertical: 14, 
          paddingHorizontal: 20, 
          borderRadius: 8, 
          flex: 1, 
          marginLeft: 8,
          alignItems: 'center',
        }} 
        onPress={() => handleUpdateSchedule(scheduleData.id)}
      >
        <Text style={{ color: THEME.text, fontWeight: 'bold', fontSize: 16 }}>Update</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <TouchableOpacity
        style={styles.addScheduleButton}
        onPress={() => setIsScheduleModalVisible(true)}
      >
        <Icon name="plus" size={24} color={THEME.text} />
        <Text style={styles.addScheduleText}>Add Schedule</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
    padding: SPACING.lg,
  },
  lecturerHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lecturerSectionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  lecturerSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  takeAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    elevation: 3,
  },
  takeAttendanceText: {
    color: THEME.text,
    marginLeft: SPACING.sm,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  classCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: THEME.textSecondary,
    width: 280,
    elevation: 2,
  },
  selectedClassCard: {
    backgroundColor: THEME.cardDark,
    borderLeftColor: THEME.accent,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  classCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classIconContainer: {
    marginRight: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 77, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.bold,
  },
  classSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  classStudents: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  attendanceHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  attendanceSectionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  attendanceSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  attendanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    elevation: 2,
  },
  attendanceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 77, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  studentId: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  attendanceProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    height: 4,
    marginTop: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: THEME.accent,
    borderRadius: 4,
  },
  progressText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginLeft: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  attendanceStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: SPACING.sm,
  },
  attendanceStat: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
    minWidth: 60,
  },
  attendanceStatValue: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
  attendanceStatLabel: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: THEME.text,
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  emptyText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  courseListContainer: {
    paddingBottom: SPACING.md,
  },
  attendanceListContainer: {
    paddingBottom: SPACING.md,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: THEME.darker,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    color: THEME.text,
    backgroundColor: 'rgba(255,255,255,0.05)',
    fontSize: 16,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 5,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addScheduleText: {
    color: THEME.text,
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  courseItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: THEME.card,
  },
  courseItemText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LecturerDashboard;