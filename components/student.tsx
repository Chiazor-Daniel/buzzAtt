import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getAvailableClasses, getStudentClassroom, enrollInClass, getStudentSchedule } from '../apis';
import { FONTS } from '../theme';

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  cardDark: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  overlay: 'rgba(0, 0, 0, 0.7)',
  border: 'rgba(255,255,255,0.1)',
};

const StudentDashboard = ({ navigation }) => {
  const { studentProfile } = useAuthStore();
  const [availableClasses, setAvailableClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [activeTab, setActiveTab] = useState('enrolled');
  const [selectedClassSchedule, setSelectedClassSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    console.log('Class details modal visibility:', !!selectedClassDetails);
    console.log('Schedule modal visibility:', !!selectedClassSchedule);
  }, [selectedClassDetails, selectedClassSchedule]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStudentData = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      console.log('Fetching student data...');
      const [availableData, enrolledData] = await Promise.all([
        getAvailableClasses(),
        getStudentClassroom()
      ]);
      
      console.log('Available classes API response:', availableData);
      console.log('Enrolled classes API response:', enrolledData);
      
      if (isMounted.current) {
        setAvailableClasses(Array.isArray(availableData) ? availableData : []);
        
        // Fetch schedules for all enrolled classes
        const enrolledClassesWithSchedules = await Promise.all(
          enrolledData.map(async (classItem) => {
            try {
              const schedule = await getStudentSchedule(classItem.id);
              console.log(`Schedule for class ${classItem.id}:`, schedule.data);
              return { ...classItem, schedule: schedule.data };
            } catch (error) {
              console.error(`Error fetching schedule for class ${classItem.id}:`, error);
              return { ...classItem, schedule: null };
            }
          })
        );
        
        console.log('Final enrolled classes with schedules:', enrolledClassesWithSchedules);
        setEnrolledClasses(Array.isArray(enrolledClassesWithSchedules) ? enrolledClassesWithSchedules : []);
      }
    } catch (error) {
      console.error('Error fetching student classes:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load classes. Please try again later.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStudentData();
    console.log(enrolledClasses)
    console.log(availableClasses)
  }, []);

  const fetchClassSchedule = async (classId) => {
    if (!classId) return;
    setLoadingSchedule(true);
    try {
      console.log('Fetching schedule for class ID:', classId);
      const response = await getStudentSchedule(classId);
      console.log('Schedule API Response:', response);
      console.log('Schedule data:', response.data);
      if (isMounted.current) {
        setSelectedClassSchedule(response.data);
      }
    } catch (error) {
      console.error('Schedule fetching error details:', {
        error: error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      if (isMounted.current) {
        Alert.alert(
          'Error',
          error.message || 'Failed to load schedule. Please try again later.'
        );
      }
    } finally {
      if (isMounted.current) {
        setLoadingSchedule(false);
      }
    }
  };

  const fetchClassDetails = async (classId) => {
    if (!classId) return;
    setLoadingDetails(true);
    try {
      const classDetails = enrolledClasses.find(c => c.id === classId);
      if (isMounted.current) {
        setSelectedClassDetails(classDetails);
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
      if (isMounted.current) {
        Alert.alert('Error', 'Failed to load class details. Please try again later.');
      }
    } finally {
      if (isMounted.current) {
        setLoadingDetails(false);
      }
    }
  };

  const handleClassSelect = (classItem) => {
    if (!classItem) return;
    // navigation.navigate('StudentScreen', { classData: classItem });
  };

  const handleEnroll = async (classId) => {
    console.log('Attempting to enroll in class:', classId);
    
    if (enrollingId === classId) {
      return;
    }

    setEnrollingId(classId);

    try {
      const response = await enrollInClass(classId);
      
      if (isMounted.current) {
        Alert.alert(
          'Success!', 
          'You have successfully enrolled in this class.',
          [{ text: 'OK', onPress: () => fetchStudentData() }]
        );
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      if (isMounted.current) {
        let errorMessage = 'Unable to enroll in this class. Please try again.';
        if (error.response && error.response.data) {
          const errorDetail = error.response.data.detail;
          console.error('Server error detail:', errorDetail);
          if (errorDetail.includes('already enrolled')) {
            errorMessage = 'You are already enrolled in this class.';
          } else {
            errorMessage = errorDetail;
          }
        }
        Alert.alert('Enrollment Failed', errorMessage);
      }
    } finally {
      if (isMounted.current) {
        setEnrollingId(null);
      }
    }
  };

  const handleViewSchedule = (classItem) => {
    console.log('Class item data:', JSON.stringify(classItem, null, 2));
    console.log('Class ID:', classItem.id);
    
    if (!classItem.id) {
      console.error('No class ID found in class item');
      Alert.alert('Error', 'No class ID found. Please try again.');
      return;
    }

    setSelectedClassSchedule(null);
    console.log('Fetching schedule using class ID:', classItem.id);
    fetchClassSchedule(classItem.id);
  };

  const handleViewDetails = (classItem) => {
    console.log('Class item data:', classItem);
    console.log('Setting selectedClassDetails:', classItem);
    setSelectedClassDetails(classItem);
  };

  const handleTakeAttendance = (classItem) => {
    navigation.navigate('StudentScreen', {
      classData: classItem,
      className: classItem.name || classItem.description || 'Class Session'
    });
  };

  const renderScheduleItem = ({ item }) => {
    console.log('Rendering schedule item:', item);
    const startTime = new Date(item.start_time);
    const endTime = new Date(item.end_time);
    
    return (
      <View style={styles.scheduleItem}>
        <View style={styles.scheduleTimeContainer}>
          <Text style={styles.scheduleTime}>{startTime.toLocaleTimeString()}</Text>
          <Text style={styles.scheduleTime}>to</Text>
          <Text style={styles.scheduleTime}>{endTime.toLocaleTimeString()}</Text>
        </View>
        <View style={styles.scheduleDetails}>
          <Text style={styles.scheduleTitle}>{item.description || 'Class Session'}</Text>
          <Text style={styles.scheduleLecturer}>
            <Icon name="account-tie" size={14} color={THEME.textSecondary} />{' '}
            {item.lecturer_name || 'Lecturer'}
          </Text>
        </View>
      </View>
    );
  };

  const renderStudentClassCard = (item, isEnrolled) => {
    if (!item || !item.id) return null;
    
    return (
      <TouchableOpacity 
        style={[
          styles.classCard,
          { borderLeftColor: isEnrolled ? THEME.success : THEME.accent }
        ]}
        onPress={() => {
          if (activeTab === 'enrolled') {
            handleViewDetails(item);
          }
        }}
      >
        <View style={styles.classCardContent}>
          <View style={styles.classIconContainer}>
            <Icon 
              name={isEnrolled ? "book-open-variant" : "book-plus"} 
              size={28} 
              color={isEnrolled ? THEME.success : THEME.accent}
            />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{item.name || item.description || 'Untitled Class'}</Text>
            <Text style={styles.classSubtitle}>
             {item?.description}
            </Text>
          </View>
        </View>
        
        {isEnrolled ? (
          <View style={styles.classActions}>
            <TouchableOpacity 
              style={styles.enrollButton}
              onPress={() => handleTakeAttendance(item)}
            >
              
              <Text style={styles.enrollButtonText}>Take Attendance</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.enrollButton, enrollingId === item.id && styles.enrollButtonLoading]}
            onPress={() => handleEnroll(item.id)}
            disabled={enrollingId === item.id}
          >
            {enrollingId === item.id ? (
              <>
                <ActivityIndicator size="small" color={THEME.text} />
                <Text style={styles.enrollButtonText}>Enrolling...</Text>
              </>
            ) : (
              <>
                <Icon name={item.is_enrolled ? "check-circle" : "book-plus"} size={16} color={THEME.text} />
                <Text style={styles.enrollButtonText}>{item.is_enrolled ? 'Enrolled ✓' : 'Enroll'}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderAvailableClassCard = (item) => {
    if (!item || !item.id) return null;
    
    return (
      <TouchableOpacity 
        style={[
          styles.classCard,
          { borderLeftColor: THEME.accent }
        ]}
      >
        <View style={styles.classCardContent}>
          <View style={styles.classIconContainer}>
            <Icon 
              name="book-plus" 
              size={28} 
              color={THEME.accent}
            />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{item?.classroom_id.slice(0,10)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.enrollButton,
            enrollingId === item.id && styles.enrollButtonLoading,
            item.is_enrolled && styles.enrollButtonDisabled
          ]}
          onPress={() => handleEnroll(item.id)}
          disabled={enrollingId === item.id || item.is_enrolled}
        >
          {enrollingId === item.id ? (
            <>
              <ActivityIndicator size="small" color={THEME.text} />
              <Text style={styles.enrollButtonText}>Enrolling...</Text>
            </>
          ) : (
            <>
              <Icon name={item.is_enrolled ? "check-circle" : "book-plus"} size={16} color={THEME.text} />
              <Text style={styles.enrollButtonText}>{item.is_enrolled ? 'Enrolled ✓' : 'Enroll'}</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderClassDetailsModal = () => {
    console.log('Rendering details modal:', !!selectedClassDetails);
    console.log('Class details data:', selectedClassDetails);
    
    if (!selectedClassDetails) return null;

    return (
      <Modal
        visible={!!selectedClassDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Closing details modal');
          setSelectedClassDetails(null);
        }}
        hardwareAccelerated={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                console.log('Close button pressed');
                setSelectedClassDetails(null);
              }}>
                <Icon name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Class Details</Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.detailsContainer}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Class Name</Text>
                    <Text style={styles.detailValue}>
                      {selectedClassDetails?.name || selectedClassDetails?.description || 'Untitled Class'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Department ID</Text>
                    <Text style={styles.detailValue}>
                      {selectedClassDetails?.department_id || 'Not available'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Class Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Class ID</Text>
                    <Text style={styles.detailValue}>
                      {selectedClassDetails?.id || 'Not available'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Head Lecturer ID</Text>
                    <Text style={styles.detailValue}>
                      {selectedClassDetails?.head_lecturer_id || 'Not available'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderScheduleModal = () => {
    console.log('Rendering schedule modal:', !!selectedClassSchedule);
    console.log('Schedule data:', selectedClassSchedule);
    
    if (!selectedClassSchedule) return null;

    return (
      <Modal
        visible={!!selectedClassSchedule}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Closing schedule modal');
          setSelectedClassSchedule(null);
        }}
        hardwareAccelerated={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                console.log('Schedule close button pressed');
                setSelectedClassSchedule(null);
              }}>
                <Icon name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Class Schedule</Text>
            </View>
            
            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {loadingSchedule ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={THEME.accent} />
                  <Text style={styles.loaderText}>Loading schedule...</Text>
                </View>
              ) : (
                <View style={styles.scheduleContainer}>
                  {Array.isArray(selectedClassSchedule) && selectedClassSchedule.length > 0 ? (
                    <FlatList
                      data={selectedClassSchedule}
                      keyExtractor={(item, index) => `schedule-${item.id || index}`}
                      renderItem={renderScheduleItem}
                      contentContainerStyle={styles.scheduleList}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Icon name="calendar-blank" size={48} color={THEME.textSecondary} />
                      <Text style={styles.emptyTitle}>No Schedules Found</Text>
                      <Text style={styles.emptyText}>
                        This class doesn't have any scheduled sessions yet.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderStudentEmptyState = (tabType) => (
    <View style={styles.emptyContainer}>
      <Icon 
        name={tabType === 'enrolled' ? "book-remove" : "book-search-outline"} 
        size={80} 
        color={THEME.textSecondary} 
      />
      <Text style={styles.emptyTitle}>
        {tabType === 'enrolled' ? "No Classes Yet" : "No Classes Available"}
      </Text>
      <Text style={styles.emptyText}>
        {tabType === 'enrolled' 
          ? "You haven't enrolled in any classes yet. Check out available classes to get started!" 
          : "There are no classes available for enrollment at the moment."}
      </Text>
      {tabType === 'enrolled' && (
        <TouchableOpacity 
          style={styles.emptyActionButton}
          onPress={() => setActiveTab('available')}
        >
          <Text style={styles.emptyActionButtonText}>Browse Available Classes</Text>
          <Icon name="arrow-right" size={16} color={THEME.text} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderScheduleModal()}
      {renderClassDetailsModal()}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
          onPress={() => setActiveTab('enrolled')}
        >
          <Icon 
            name="book-open-page-variant" 
            size={18} 
            color={activeTab === 'enrolled' ? THEME.text : THEME.textSecondary} 
          />
          <Text 
            style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}
          >
            My Classes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Icon 
            name="book-plus" 
            size={18} 
            color={activeTab === 'available' ? THEME.text : THEME.textSecondary} 
          />
          <Text 
            style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}
          >
            Available Classes
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={styles.loaderText}>Loading classes...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'enrolled' ? enrolledClasses : availableClasses}
          keyExtractor={(item, index) => `class-${activeTab}-${item?.id || index}`}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => activeTab === 'enrolled' ? renderStudentClassCard(item, true) : renderAvailableClassCard(item)}
          ListEmptyComponent={() => renderStudentEmptyState(activeTab)}
          refreshing={loading}
          onRefresh={fetchStudentData}
        />
      )}
    </View>
  );
};

const styles = {
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
     padding: 8,
     paddingVertical: 10,
     marginBottom: 20,
     elevation: 3,
   },
   tab: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderRadius: 10,
   },
   activeTab: {
     backgroundColor: THEME.accent,
   },
   tabText: {
     fontSize: 14,
     marginLeft: 8,
     color: THEME.textSecondary,
     fontFamily: FONTS.regular,
   },
   activeTabText: {
     color: THEME.text,
   },
  classCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: THEME.textSecondary,
    elevation: 2,
  },
  classCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 77, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  classSubtitle: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  viewButtonText: {
    color: THEME.success,
    marginLeft: 4,
    fontWeight: '600',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 77, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  scheduleButtonText: {
    color: THEME.accent,
    marginLeft: 4,
    fontWeight: '600',
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: THEME.accent,
  },
  enrollButtonLoading: {
    opacity: 0.7,
  },
  enrollButtonDisabled: {
    opacity: 0.5,
  },
  enrollButtonText: {
    color: THEME.text,
    marginRight: 8,
    marginLeft: 8,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: THEME.text,
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 3,
  },
  emptyActionButtonText: {
    color: THEME.text,
    marginRight: 8,
    fontWeight: '600',
    fontSize: 15,
  },
  listContainer: {
    paddingBottom: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  scheduleTimeContainer: {
    width: 100,
    alignItems: 'center',
    marginRight: 16,
  },
  scheduleTime: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scheduleLecturer: {
    color: THEME.textSecondary,
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    // backgroundColor: THEME.card,
    borderRadius: 16,
    width: '90%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalBody: {
    flex: 1,
    width: '100%',
  },
  detailsContainer: {
    width: '100%',
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  detailLabel: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    width: '40%',
  },
  detailValue: {
    color: THEME.text,
    fontSize: 14,
    width: '60%',
    textAlign: 'right',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 8,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
};

export default StudentDashboard;