import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Modal, Button, Animated, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getCourses, getAttendance, getStudents, getLecturerSchedules, createSchedule, updateSchedule } from '../apis';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { StatusBadge } from './utils';
import { useAttendanceStore } from '../store/attendanceStore';



const LecturerDashboard = ({ navigation }) => {
  const { lecturerProfile, studentProfile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('courses');
  const [lecturerCourses, setLecturerCourses] = useState([]);
  const [students, setStudents] = useState([
    {
      id: '3',
      name: 'Alice Johnson',
      attendance_count: 18,
      absence_count: 0,
    },
    {
      id: '4',
      name: 'Bob Brown',
      attendance_count: 14,
      absence_count: 3,
    },
    {
      id: '5',
      name: 'Emily Davis',
      attendance_count: 16,
      absence_count: 1,
    },
    {
      id: '6',
      name: 'Michael Wilson',
      attendance_count: 13,
      absence_count: 2,
    },
    {
      id: '7',
      name: 'Sarah Taylor',
      attendance_count: 17,
      absence_count: 0,
    },
    {
      id: '8',
      name: 'David Anderson',
      attendance_count: 15,
      absence_count: 1,
    },
    {
      id: '9',
      name: 'Olivia Moore',
      attendance_count: 14,
      absence_count: 2,
    },
    {
      id: '10',
      name: 'William Jackson',
      attendance_count: 16,
      absence_count: 0,
    },
  ]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    id: '',
    course_id: '',
    schedule: [{ day: '', start_time: '', end_time: '' }]
  });
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [cachedAttendances, setCachedAttendances] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [syncState, setSyncState] = useState({
    isSyncing: false,
    progress: 0,
    currentSyncingItem: null,
    lastSynced: null
  });
  
  // New state for sync functionality
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  // const fetchLecturerData = async () => {
  //   console.log('User:', user);
  //   setLoading(true);
  //   try {
  //     const lecturerId = user?.id;
  //     console.log('Lecturer ID:', lecturerId);
  //     if (lecturerId) {
  //       const coursesData = await getCourses(lecturerId);
  //       console.log('Courses data:', coursesData);
  //       const schedulesData = await getLecturerSchedules(lecturerId);
  //       console.log('Schedules data:', schedulesData);

  //       const validCoursesData = Array.isArray(coursesData) ? coursesData : [];
  //       setLecturerCourses(validCoursesData);
  //       setSchedules(schedulesData || []);

  //       if (validCoursesData.length > 0) {
  //         setSelectedCourse(validCoursesData[0]);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching lecturer data:', error);
  //     Alert.alert('Error', 'Failed to load courses. Please try again later.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const fetchAttendance = async (courseId) => {
  //   if (!courseId) return;

  //   setLoadingAttendance(true);
  //   try {
  //     const attendanceData = await getAttendance(courseId);
  //     setAttendanceData(Array.isArray(attendanceData) ? attendanceData : []);
  //   } catch (error) {
  //     console.error('Error fetching attendance:', error);
  //     Alert.alert('Error', 'Failed to load attendance data.');
  //   } finally {
  //     setLoadingAttendance(false);
  //   }
  // };


  const fetchLecturerData = async () => {
    console.log('Loading mock data...');
    setLoading(true);
    try {
      // Mock courses data
      const mockCourses = [
        {
          id: 'course1',
          classroom_id: 'class1',
          title: 'Introduction to Computer Science',
          description: 'Fundamentals of programming and algorithms',
          student_count: 5,
          code: 'CS101'
        },
        {
          id: 'course2',
          classroom_id: 'class2',
          title: 'Data Structures',
          description: 'Advanced programming concepts',
          student_count: 5,
          code: 'CS201'
        },
        {
          id: 'course3',
          classroom_id: 'class3',
          title: 'Database Systems',
          description: 'Relational databases and SQL',
          student_count: 5,
          code: 'CS301'
        }
      ];
  
      // Mock schedules data
      const mockSchedules = [
        {
          id: 'schedule1',
          course_id: 'course1',
          course_title: 'Introduction to Computer Science',
          day: 'Monday',
          start_time: '09:00',
          end_time: '11:00'
        },
        {
          id: 'schedule2',
          course_id: 'course2',
          course_title: 'Data Structures',
          day: 'Wednesday',
          start_time: '13:00',
          end_time: '15:00'
        },
        {
          id: 'schedule3',
          course_id: 'course3',
          course_title: 'Database Systems',
          day: 'Friday',
          start_time: '10:00',
          end_time: '12:00'
        }
      ];
  
      setLecturerCourses(mockCourses);
      setSchedules(mockSchedules);
      
      // Select first course by default
      if (mockCourses.length > 0) {
        setSelectedCourse(mockCourses[0]);
      }
  
    } catch (error) {
      console.error('Error loading mock data:', error);
      Alert.alert('Error', 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAttendance = async (courseId) => {
    if (!courseId) return;
  
    setLoadingAttendance(true);
    try {
      // Mock attendance data
      const mockAttendance = [
        {
          student_id: 'student1',
          student_name: 'John Doe',
          matric: '2021/001',
          attendance_count: 12,
          absence_count: 2,
          last_attended: '2023-05-15'
        },
        {
          student_id: 'student2',
          student_name: 'Jane Smith',
          matric: '2021/002',
          attendance_count: 10,
          absence_count: 4,
          last_attended: '2023-05-08'
        },
        {
          student_id: 'student3',
          student_name: 'Bob Johnson',
          matric: '2021/003',
          attendance_count: 14,
          absence_count: 0,
          last_attended: '2023-05-15'
        },
        {
          student_id: 'student4',
          student_name: 'Alice Brown',
          matric: '2021/004',
          attendance_count: 8,
          absence_count: 6,
          last_attended: '2023-04-24'
        },
        {
          student_id: 'student5',
          student_name: 'Charlie Wilson',
          matric: '2021/005',
          attendance_count: 11,
          absence_count: 3,
          last_attended: '2023-05-15'
        }
      ];
  
      setAttendanceData(mockAttendance);
      
    } catch (error) {
      console.error('Error loading mock attendance:', error);
      Alert.alert('Error', 'Failed to load attendance data.');
    } finally {
      setLoadingAttendance(false);
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

  useEffect(() => {
    // Load cached attendances when the sync tab is selected
    if (activeTab === 'autosync') {
      // Add sample data for testing
      const sampleAttendances = [
        {
          date: '2025-05-04',
          students: [
            { id: '1', name: 'John Doe', matric: '2021/001' },
            { id: '2', name: 'Jane Smith', matric: '2021/002' },
            { id: '3', name: 'Bob Johnson', matric: '2021/003' }
          ],
          synced: false
        },
        {
          date: '2025-05-03',
          students: [
            { id: '4', name: 'Alice Brown', matric: '2021/004' },
            { id: '5', name: 'Charlie Wilson', matric: '2021/005' }
          ],
          synced: false
        },
        {
          date: '2025-05-02',
          students: [
            { id: '6', name: 'David Green', matric: '2021/006' },
            { id: '7', name: 'Eva White', matric: '2021/007' },
            { id: '8', name: 'Frank Black', matric: '2021/008' },
            { id: '9', name: 'Grace Blue', matric: '2021/009' }
          ],
          synced: false
        }
      ];

      // Combine sample data with actual data from store
      const attendanceStore = useAttendanceStore.getState();
      const allAttendances = attendanceStore.getAllAttendance();
      const storeData = Object.entries(allAttendances).map(([date, students]) => ({
        date,
        students,
        synced: false
      }));

      setCachedAttendances([...sampleAttendances, ...storeData]);
    }
  }, [activeTab]);

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

  const handleClassSelect = (course) => {
    setSelectedCourse(course);
    setIsCourseModalVisible(true);
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
    <View style={styles.courseCardContainer}>
      <TouchableOpacity
        style={styles.courseCard}
        onPress={() => {
          setSelectedCourse(item);
          setIsCourseModalVisible(true);
        }}
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
      
      <TouchableOpacity
        style={styles.startAttendanceButton}
        onPress={() => navigation.navigate('LecturerScreen', {
          courseId: item.id,
          courseTitle: item.title || item.description || 'Course'
        })}
      >
        <Text style={styles.startAttendanceButtonText}>Start Attendance</Text>
        <Icon name="arrow-right" size={16} color={THEME.text} />
      </TouchableOpacity>
    </View>
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
      <TouchableOpacity
        style={[
          styles.attendanceCard,
          { borderLeftColor: attendancePercentage >= 75 ? THEME.success : attendancePercentage >= 50 ? THEME.warning : THEME.error }
        ]}
        onPress={() => studentId ? handleViewStudentAttendance(studentId) : null}
      >
        <View style={styles.attendanceCardContent}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.student_name || 'Student'}</Text>
            <View style={styles.attendanceProgress}>
              <View style={[styles.progressBar, { width: `${attendancePercentage}%` }]} />
            </View>
              <Text style={styles.progressText}>{Math.round(attendancePercentage)}% attendance</Text>
          </View>
        </View>
      </TouchableOpacity>
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
    const handleSyncAll = () => {
      setIsSyncing(true);
      // Implement sync all logic here
      setTimeout(() => {
        setIsSyncing(false);
        setSyncComplete(true);
        // Reset after 3 seconds
        setTimeout(() => setSyncComplete(false), 3000);
      }, 2000);
    };
  
    const handleSyncSingle = (date) => {
      setIsSyncing(true);
      // Implement single sync logic here
      setTimeout(() => {
        setIsSyncing(false);
        setSyncComplete(true);
        // Reset after 3 seconds
        setTimeout(() => setSyncComplete(false), 3000);
        
        // Update the cached attendances to mark this one as synced
        setCachedAttendances(prev => prev.map(item => 
          item.date === date ? {...item, synced: true} : item
        ));
      }, 2000);
    };
  
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
          <View style={{ flex: 1, width: '100%' }}>
            <FlatList
              data={cachedAttendances}
              keyExtractor={(item) => item.date}
              contentContainerStyle={styles.attendanceListContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.attendanceItem,
                    selectedAttendance === item.date && styles.selectedAttendanceItem,
                    item.synced && styles.syncedItem
                  ]}
                  onPress={() => setSelectedAttendance(item.date)}
                >
                  <View style={styles.attendanceItemContent}>
                    <Text style={styles.attendanceItemDate}>{item.date}</Text>
                    <Text style={styles.attendanceItemStudents}>
                      {item.students.length} students
                    </Text>
                    {item.synced && (
                      <View style={styles.syncStatus}>
                        <Icon name="check" size={16} color={THEME.success} />
                        <Text style={styles.syncStatusText}>Synced</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.attendanceItemActions}>
                    <TouchableOpacity
                      style={[
                        styles.syncButtonSmall,
                        item.synced && { backgroundColor: THEME.success }
                      ]}
                      onPress={() => handleSyncSingle(item.date)}
                      disabled={item.synced}
                    >
                      <Icon 
                        name={item.synced ? "check" : "cloud-sync"} 
                        size={20} 
                        color={THEME.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => renderLecturerEmptyState('sync')}
              ListHeaderComponent={
                <Text style={styles.syncInfoText}>
                  Sync your attendance data with the cloud database.
                 
                </Text>
              }
              ListFooterComponent={
                <View style={styles.syncButtonContainer}>
                  <TouchableOpacity
                    style={styles.syncButton}
                    onPress={handleSyncAll}
                  >
                    <Icon name="cloud-sync" size={24} color={THEME.text} />
                    <Text style={styles.syncButtonText}>Sync All</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        )}
      </View>
    );
  };

  const renderStudentCard = (item) => (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.attendanceCard}
        onPress={() => handleViewStudentAttendance(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.attendanceCardContent}>
          <View style={styles.studentIconContainer}>
            <Icon name="account" size={24} color={THEME.text} />
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name || 'Student'}</Text>
            <Text style={styles.studentId}>{item.matric || 'ID unavailable'}</Text>
            <Text style={styles.studentEmail}>{item.email || 'No email'}</Text>
          </View>
        </View>
        <StatusBadge 
          status={item.attendance_count / (item.attendance_count + item.absence_count) >= 0.75 ? 'good' : 
                 item.attendance_count / (item.attendance_count + item.absence_count) >= 0.5 ? 'warning' : 'bad'}
          // text={`${Math.round((item.attendance_count / (item.attendance_count + item.absence_count)) * 100)%`}
        />
      </TouchableOpacity>
    </Animated.View>
  )

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
                contentContainerStyle={styles.courseListContainer}
                renderItem={({ item }) => renderLecturerCourseCard(item)}
                ListEmptyComponent={() => renderLecturerEmptyState('courses')}
                refreshing={loading}
                onRefresh={fetchLecturerData}
              />
            </>
          )}

          {isCourseModalVisible && (
            <Modal
              visible={isCourseModalVisible}
              onRequestClose={() => setIsCourseModalVisible(false)}
              animationType="slide"
              transparent={true}
            >
              <View style={styles.modalContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={styles.modalTitle}>{selectedCourse?.title || 'Course Details'}</Text>
                  <TouchableOpacity onPress={() => setIsCourseModalVisible(false)}>
                    <Icon name="close" size={24} color={THEME.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.attendanceHeaderContainer}>
                  <View>
                    <Text style={styles.attendanceSectionTitle}>
                      Attendance for {selectedCourse?.title || selectedCourse?.description || 'Course'}
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
                    onRefresh={() => fetchAttendance(selectedCourse?.classroom_id)}
                  />
                )}
              </View>
            </Modal>
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
  attendanceListContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    backgroundColor: THEME.card,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  selectedAttendanceItem: {
    borderWidth: 2,
    borderColor: THEME.accent,
  },
  attendanceItemContent: {
    flex: 1,
  },
  attendanceItemDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: THEME.text,
  },
  attendanceItemStudents: {
    fontSize: FONT_SIZES.sm,
    color: THEME.textSecondary,
  },
  attendanceItemActions: {
    alignItems: 'center',
  },
  syncButtonContainer: {
    marginVertical: SPACING.lg,
    alignItems: 'center',
  },
  syncButtonSmall: {
    padding: SPACING.sm,
    borderRadius: SPACING.sm,
    backgroundColor: THEME.accent,
    alignItems: 'center',
  },
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
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
  },
  courseListContainer: {
    paddingBottom: SPACING.md,
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
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  courseListContainer: {
    paddingBottom: SPACING.sm,
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
  studentEmail: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
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
  syncContainer: {
  flex: 1,
  backgroundColor: THEME.darker,
},
syncedItem: {
  borderLeftWidth: 4,
  borderLeftColor: THEME.success,
},
syncStatusText: {
  fontSize: FONT_SIZES.xs,
  color: THEME.success,
  marginLeft: SPACING.xs,
},

syncButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: THEME.accent,
  paddingVertical: SPACING.md,
  paddingHorizontal: SPACING.lg,
  borderRadius: 8,
  width: '100%',
  justifyContent: 'center',
},
syncButtonText: {
  color: THEME.text,
  fontSize: FONT_SIZES.md,
  fontWeight: '600',
  marginLeft: SPACING.sm,
},
syncInfoText: {
  color: THEME.textSecondary,
  fontSize: FONT_SIZES.sm,
  textAlign: 'center',
  marginBottom: SPACING.lg,
  paddingHorizontal: SPACING.md,
},
syncAnimationContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
progressContainer: {
  marginTop: SPACING.md,
},
syncContext: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
syncText: {
  color: THEME.text,
  fontSize: FONT_SIZES.md,
  fontWeight: '600',
  marginLeft: SPACING.sm,
},
courseCardContainer: {
  position: 'relative',
  marginRight: SPACING.md,
  marginBottom: SPACING.lg,
},

startAttendanceButton: {
  position: 'absolute',
  bottom: -SPACING.sm, // Half outside the card
  right: SPACING.md,
  backgroundColor: THEME.accent,
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: SPACING.sm,
  paddingHorizontal: SPACING.md,
  borderRadius: 20,
  elevation: 3,
  shadowColor: THEME.accent,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
},
startAttendanceButtonText: {
  color: THEME.text,
  fontWeight: '600',
  fontSize: FONT_SIZES.sm,
  marginRight: SPACING.xs,
},

});

export default LecturerDashboard;