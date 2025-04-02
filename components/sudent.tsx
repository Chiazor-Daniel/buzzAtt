import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getAvailableClasses, getStudentClassroom, enrollInClass } from '../apis';

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
};

const StudentDashboard = ({ navigation }) => {
  const { studentProfile } = useAuthStore();
  const [availableClasses, setAvailableClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [activeTab, setActiveTab] = useState('enrolled');
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStudentData = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const [availableData, enrolledData] = await Promise.all([
        getAvailableClasses(),
        getStudentClassroom()
      ]);
      
      if (isMounted.current) {
        setAvailableClasses(Array.isArray(availableData) ? availableData : []);
        setEnrolledClasses(Array.isArray(enrolledData) ? enrolledData : []);
      }
    } catch (error) {
      console.error('Error fetching student classes:', error);
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
  }, []);

  const handleClassSelect = (classItem) => {
    if (!classItem) return;
    navigation.navigate('StudentScreen', { classData: classItem });
  };

  const handleEnroll = async (classId) => {
    if (!classId) return;
    
    setEnrollingId(classId);
    try {
      await enrollInClass(classId);
      
      if (isMounted.current) {
        Alert.alert(
          'Success!', 
          'You have successfully enrolled in this class.',
          [{ text: 'OK', onPress: () => fetchStudentData() }]
        );
      }
    } catch (error) {
      console.error('Error enrolling in class:', error);
      if (isMounted.current) {
        Alert.alert('Enrollment Failed', 'Unable to enroll in this class. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setEnrollingId(null);
      }
    }
  };

  const renderStudentClassCard = (item, isEnrolled) => {
    if (!item || !item.id) return null;
    
    return (
      <TouchableOpacity 
        style={[
          styles.classCard,
          { borderLeftColor: isEnrolled ? THEME.success : THEME.accent }
        ]}
        onPress={() => isEnrolled ? handleClassSelect(item) : null}
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
            <Text style={styles.classTitle}>{item.description || item.title || 'Untitled Class'}</Text>
            <Text style={styles.classSubtitle}>
              Room {item.classroom_id ? item.classroom_id.slice(0, 4) : 'TBA'}
            </Text>
            {item.lecturer_name ? (
              <Text style={styles.classLecturer}>
                <Icon name="account-tie" size={14} color={THEME.textSecondary} /> {' '}
                {item.lecturer_name}
              </Text>
            ) : null}
          </View>
        </View>
        
        {isEnrolled ? (
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => handleClassSelect(item)}
          >
            <Text style={styles.viewButtonText}>View</Text>
            <Icon name="chevron-right" size={16} color={THEME.success} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.enrollButton}
            onPress={() => handleEnroll(item.id)}
            disabled={enrollingId === item.id}
          >
            {enrollingId === item.id ? (
              <ActivityIndicator size="small" color={THEME.text} />
            ) : (
              <>
                <Text style={styles.enrollButtonText}>Enroll</Text>
                <Icon name="plus" size={16} color={THEME.text} />
              </>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
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
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
          onPress={() => setActiveTab('enrolled')}
        >
          <Icon 
            name="book-open-page-variant" 
            size={18} 
            color={activeTab === 'enrolled' ? THEME.accent : THEME.textSecondary} 
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
            color={activeTab === 'available' ? THEME.accent : THEME.textSecondary} 
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
          renderItem={({ item }) => renderStudentClassCard(item, activeTab === 'enrolled')}
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
    padding: 6,
    marginBottom: 20,
    elevation: 3,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  activeTab: {
    backgroundColor: 'rgba(124, 77, 255, 0.2)',
    borderBottomWidth: 3,
    borderBottomColor: THEME.accent,
  },
  tabText: {
    color: THEME.textSecondary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: THEME.text,
    fontWeight: '700',
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
  classLecturer: {
    color: THEME.textSecondary,
    fontSize: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  viewButtonText: {
    color: THEME.success,
    marginRight: 8,
    fontWeight: '600',
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
  },
  enrollButtonText: {
    color: THEME.text,
    marginRight: 8,
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
};

export default StudentDashboard;