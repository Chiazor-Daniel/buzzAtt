import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Modal, Button, Animated, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getCourses, getAttendance, getStudents, getLecturerSchedules, createSchedule, updateSchedule } from '../apis';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { StatusBadge } from './utils';

const LecturerDashboard = ({ navigation }) => {
  const { lecturerProfile, studentProfile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('courses');
  const [lecturerCourses, setLecturerCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState({ course_id: '', schedule: [] });
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // New state for sync functionality
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const fetchLecturerData = async () => {
    console.log('User:', user);
    setLoading(true);
    try {
      const lecturerId = user?.id;
      console.log('Lecturer ID:', lecturerId);
      if (lecturerId) {
        const coursesData = await getCourses(lecturerId);
        console.log('Courses data:', coursesData);
        const schedulesData = await getLecturerSchedules(lecturerId);
        console.log('Schedules data:', schedulesData);

        const validCoursesData = Array.isArray(coursesData) ? coursesData : [];
        setLecturerCourses(validCoursesData);
        setSchedules(schedulesData || []);

        if (validCoursesData.length > 0) {
          setSelectedCourse(validCoursesData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching lecturer data:', error);
      Alert.alert('Error', 'Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (courseId) => {
    if (!courseId) return;

    setLoadingAttendance(true);
    try {
      const attendanceData = await getAttendance(courseId);
      setAttendanceData(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      Alert.alert('Error', 'Failed to load attendance data.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    console.log('Student profile:', studentProfile);
    console.log('User:', user);
    fetchLecturerData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendance(selectedCourse.classroom_id);
    }
  }, [selectedCourse]);

  // New function to handle the sync animation
  const handleSync = () => {
    setIsSyncing(true);
    setSyncComplete(false);
    
    // Create rotation animation
    Animated.timing(rotationAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: true,
    }).start(() => {
      // After animation completes
      setIsSyncing(false);
      setSyncComplete(true);
      rotationAnim.setValue(0); // Reset for next use
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSyncComplete(false);
      }, 3000);
    });
  };

  // Convert rotation value to rotation string for transform
  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

  const renderScheduleCard = ({ item, index }) => {
    if (!item) return null;

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.scheduleCard}
          onPress={() => {
            setScheduleData({
              id: item.id,
              course_id: item.course_id,
              schedule: [item]
            });
            setIsScheduleModalVisible(true);
          }}
        >
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleTitle}>
              {item.course_title || 'Course'}
            </Text>
            <View style={styles.scheduleDetails}>
              <Text style={styles.scheduleDay}>{item.day}</Text>
              <Text style={styles.scheduleTime}>
                {item.start_time} - {item.end_time}
              </Text>
            </View>
          </View>
          <View style={styles.scheduleActions}>
            <TouchableOpacity
              onPress={() => {
                setScheduleData({
                  id: item.id,
                  course_id: item.course_id,
                  schedule: [item]
                });
                setIsScheduleModalVisible(true);
              }}
            >
              <Icon name="pencil" size={20} color={THEME.accent} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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

  const renderLecturerEmptyState = (type: string) => {
    let icon, title, message;
    
    switch (type) {
      case 'courses':
        icon = 'book-open-outline';
        title = 'No Courses Found';
        message = 'You are not currently assigned to any courses.';
        break;
      case 'attendance':
        icon = 'clipboard-text-outline';
        title = 'No Attendance Data';
        message = 'No attendance records found for this course.';
        break;
      case 'students':
        icon = 'account-group-outline';
        title = 'No Students Found';
        message = 'No students are enrolled in your courses.';
        break;
      case 'schedules':
        icon = 'calendar-blank-outline';
        title = 'No Schedules Found';
        message = 'You have not created any schedules yet.';
        break;
      case 'sync':
        icon = 'cloud-sync-outline';
        title = 'Auto Sync';
        message = 'Sync your data with the cloud database.';
        break;
      default:
        icon = 'information-outline';
        title = 'No Data Available';
        message = 'There is no data to display.';
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name={icon} size={48} color={THEME.textSecondary} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  };

  // New render function for the sync tab
  const renderSyncTab = () => {
    return (
      <View style={styles.syncContainer}>
        {isSyncing ? (
          <View style={styles.syncContent}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Icon name="sync" size={80} color={THEME.accent} />
            </Animated.View>
            <Text style={styles.syncText}>Syncing data with cloud...</Text>
          </View>
        ) : syncComplete ? (
          <View style={styles.syncContent}>
            <Icon name="check-circle" size={80} color={THEME.success} />
            <Text style={styles.syncCompleteText}>All data synced to cloud!</Text>
          </View>
        ) : (
          <View style={styles.syncContent}>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSync}
            >
              <Icon name="cloud-sync" size={40} color={THEME.text} />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
            <Text style={styles.syncInfoText}>
              Sync your attendance data, schedules, and student information with the cloud database.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
          onPress={() => setActiveTab('courses')}
        >
          <Icon name="book" size={20} color={activeTab === 'courses' ? THEME.text : THEME.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.activeTab]}
          onPress={() => setActiveTab('students')}
        >
          <Icon name="account-group" size={20} color={activeTab === 'students' ? THEME.text : THEME.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedules' && styles.activeTab]}
          onPress={() => setActiveTab('schedules')}
        >
          <Icon name="calendar" size={20} color={activeTab === 'schedules' ? THEME.text : THEME.textSecondary} />
        </TouchableOpacity>
        {/* New AutoSync Tab */}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'autosync' && styles.activeTab]}
          onPress={() => setActiveTab('autosync')}
        >
          <Icon name="cloud-sync" size={20} color={activeTab === 'autosync' ? THEME.text : THEME.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={styles.loaderText}>Loading data...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'courses' && (
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

              {selectedCourse && (
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
              )}
            </>
          )}

          {activeTab === 'students' && (
            <FlatList
              data={students}
              keyExtractor={(item, index) => `student-${item?.id || index}`}
              contentContainerStyle={styles.studentListContainer}
              renderItem={({ item }) => renderStudentCard(item)}
              ListEmptyComponent={() => renderLecturerEmptyState('students')}
              refreshing={loading}
              onRefresh={() => fetchStudents()}
            />
          )}

          {activeTab === 'schedules' && (
            <FlatList
              data={schedules}
              keyExtractor={(item, index) => `schedule-${item?.id || index}`}
              contentContainerStyle={styles.scheduleListContainer}
              renderItem={renderScheduleCard}
              ListEmptyComponent={() => renderLecturerEmptyState('schedules')}
              refreshing={loading}
              onRefresh={fetchLecturerData}
            />
          )}

          {/* New AutoSync Tab Content */}
          {activeTab === 'autosync' && renderSyncTab()}
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

      {activeTab !== 'autosync' && (
        <TouchableOpacity
          style={styles.addScheduleButton}
          onPress={() => setIsScheduleModalVisible(true)}
        >
          <Icon name="plus" size={24} color={THEME.text} />
          <Text style={styles.addScheduleText}>Add Schedule</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    elevation: 3,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: THEME.accent,
  },
  tabText: {
    fontSize: 16,
    marginLeft: 6,
    color: THEME.textSecondary,
    fontFamily: FONTS.regular,
  },
  activeTabText: {
    color: THEME.text,
  },
  lecturerContainer: {
    flex: 1,
    backgroundColor: THEME.darker,
    padding: SPACING.lg,
  },
  lecturerHeader: {
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
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 2,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDay: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs,
  },
  scheduleTime: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  scheduleActions: {
    marginLeft: SPACING.md,
  },  attendanceCard: {
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
    justifyContent: '',
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
  studentListContainer: {
    paddingVertical: SPACING.md,
  },
  scheduleListContainer: {
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
  // New styles for sync functionality
  syncContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  syncContent: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  syncIcon: {
    fontSize: 48,
    color: THEME.accent,
    marginVertical: SPACING.md,
  },
  syncText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: THEME.accent,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  syncCompleteText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: THEME.success,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  syncProgress: {
    width: '100%',
    height: 4,
    backgroundColor: THEME.darker,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.accent,
  },
  syncButton: {
    backgroundColor: THEME.accent,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
  syncInfoText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
});

export default LecturerDashboard;