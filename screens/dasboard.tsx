import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getStudentClassroom, getCourses, getSchedules, getAvailableClasses } from '../apis';

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

const PlaceholderCard = ({ title, message, icon }) => (
  <View style={styles.placeholderCard}>
    <Icon name={icon} size={48} color={THEME.textSecondary} />
    <Text style={styles.placeholderTitle}>{title}</Text>
    <Text style={styles.placeholderMessage}>{message}</Text>
  </View>
);

const StatCard = ({ icon, title, value, color, isPlaceholder }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    {isPlaceholder ? (
      <View style={styles.placeholderValue}>
        <Icon name="dots-horizontal" size={24} color={THEME.textSecondary} />
        <Text style={[styles.statValue, { color: THEME.textSecondary }]}>Loading...</Text>
      </View>
    ) : (
      <Text style={styles.statValue}>{value}</Text>
    )}
  </View>
);

const UpcomingCard = ({ title, subtitle, time, type, navigation, isPlaceholder }) => (
  <TouchableOpacity 
    style={[styles.upcomingCard, isPlaceholder && styles.upcomingCardPlaceholder]}
    onPress={() => !isPlaceholder && navigation.navigate('Student', { title, subtitle, time, type })}
    disabled={isPlaceholder}
  >
    <View style={styles.upcomingLeft}>
      <Icon
        name={type === 'class' ? 'book-open-variant' : 'clock-check'}
        size={24}
        color={isPlaceholder ? THEME.textSecondary : THEME.accent}
      />
      <View style={styles.upcomingInfo}>
        {isPlaceholder ? (
          <>
            <View style={styles.placeholderText} />
            <View style={[styles.placeholderText, { width: '60%' }]} />
          </>
        ) : (
          <>
            <Text style={styles.upcomingTitle}>{title}</Text>
            <Text style={styles.upcomingSubtitle}>{subtitle}</Text>
          </>
        )}
      </View>
    </View>
    <View style={styles.upcomingRight}>
      {!isPlaceholder && (
        <>
          <Text style={styles.upcomingTime}>{time}</Text>
          <Icon name="chevron-right" size={20} color={THEME.textSecondary} />
        </>
      )}
    </View>
  </TouchableOpacity>
);

const ActionButton = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Icon name={icon} size={24} color={THEME.text} />
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

const ClassListModal = ({ visible, onClose, classes, onSelect, loading, title }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={THEME.text} />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={THEME.accent} style={styles.modalLoader} />
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.classItem}
                onPress={() => onSelect(item)}
              >
                <View>
                  <Text style={styles.classTitle}>{item.description || item.title}</Text>
                  <Text style={styles.classSubtitle}>
                    Room {item.classroom_id?.slice(0, 4) || 'TBA'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={THEME.textSecondary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No classes available</Text>
            }
          />
        )}
      </View>
    </View>
  </Modal>
);

const EmptyStateMessage = ({ role, onAction }) => (
  <View style={styles.emptyStateContainer}>
    <Icon 
      name={role === 'student' ? 'school' : 'teach'} 
      size={64} 
      color={THEME.accent}
    />
    <Text style={styles.emptyStateTitle}>
      {role === 'student' ? 'Looking for classes?' : 'Create Your First Class'}
    </Text>
    <Text style={styles.emptyStateDescription}>
      {role === 'student' 
        ? "Check for available classes"
        : "Start by creating a new classroom to manage your courses and students."}
    </Text>
    <ActionButton
      icon={role === 'student' ? 'book-search' : 'plus'}
      title={role === 'student' ? 'Browse Classes' : 'Create Classroom'}
      onPress={onAction}
    />
  </View>
);

export function DashboardScreen({ navigation }) {
  const { isStudent, studentProfile } = useAuthStore();
  const [stats, setStats] = useState({
    totalClasses: null,
    attendanceRate: null,
    upcomingEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!refreshing) setLoading(true);
    try {
      if (isStudent) {
        const courses = await getStudentClassroom();
        const schedules = courses.length > 0 ? await getSchedules(courses[0]?.id) : [];
        setStats({
          totalClasses: courses.length,
          attendanceRate: 0,
          upcomingEvents: schedules,
        });
      } else {
        const courses = await getCourses();
        const schedules = courses.length > 0 ? await getSchedules(courses[0]?.id) : [];
        setStats({
          totalClasses: courses.length,
          attendanceRate: 0,
          upcomingEvents: schedules,
        });
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAvailableClasses = async () => {
    setModalLoading(true);
    try {
      const classes = await getAvailableClasses();
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error fetching available classes:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBrowseClasses = () => {
    setShowClassModal(true);
    fetchAvailableClasses();
  };

  const handleCreateClass = () => {
    navigation.navigate('CreateClass'); // You'll need to create this screen
  };

  const handleClassSelect = async (classItem) => {
    setShowClassModal(false);
    // Navigate to class details or enrollment confirmation
    navigation.navigate('ClassDetails', { classData: classItem });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      {isStudent ? (
        <ActionButton
          icon="book-search"
          title="Browse Classes"
          onPress={handleBrowseClasses}
        />
      ) : (
        <ActionButton
          icon="plus"
          title="Create Class"
          onPress={handleCreateClass}
        />
      )}
    </View>
  );

  const renderStudentStats = () => (
    <View style={styles.statsGrid}>
      <StatCard
        icon="calendar-check"
        title="Attendance Rate"
        value={stats.attendanceRate === null ? '-- %' : `${stats.attendanceRate}%`}
        color={THEME.success}
        isPlaceholder={loading}
      />
      <StatCard
        icon="book-open-page-variant"
        title="Total Classes"
        value={stats.totalClasses === null ? '--' : stats.totalClasses}
        color={THEME.accent}
        isPlaceholder={loading}
      />
      <StatCard
        icon="clock-alert"
        title="Missed Classes"
        value={loading ? '--' : '0'}
        color={THEME.error}
        isPlaceholder={loading}
      />
    </View>
  );

  const renderLecturerStats = () => (
    <View style={styles.statsGrid}>
      <StatCard
        icon="account-group"
        title="Total Students"
        value={loading ? '--' : '0'}
        color={THEME.accent}
        isPlaceholder={loading}
      />
      <StatCard
        icon="chart-line"
        title="Avg. Attendance"
        value={stats.attendanceRate === null ? '-- %' : `${stats.attendanceRate}%`}
        color={THEME.success}
        isPlaceholder={loading}
      />
      <StatCard
        icon="book-multiple"
        title="Active Courses"
        value={stats.totalClasses === null ? '--' : stats.totalClasses}
        color={THEME.warning}
        isPlaceholder={loading}
      />
    </View>
  );

  const renderContent = () => {
    if (error) {
      return (
        <PlaceholderCard
          title="Couldn't Load Dashboard"
          message="There was a problem loading your dashboard. Pull down to refresh and try again."
          icon="alert-circle-outline"
        />
      );
    }

    if (stats.totalClasses === 0) {
      return <EmptyStateMessage 
        role={isStudent ? 'student' : 'lecturer'}
        onAction={isStudent ? handleBrowseClasses : handleCreateClass}
      />;
    }

    return (
      <>
        {isStudent ? renderStudentStats() : renderLecturerStats()}
        <View style={styles.sectionHeader}>
          <Icon name="calendar-clock" size={24} color={THEME.accent} />
          <Text style={styles.sectionTitle}>
            {isStudent ? 'Upcoming Classes' : "Today's Schedule"}
          </Text>
        </View>
        
        {loading ? (
          // Show placeholder cards while loading
          [...Array(3)].map((_, index) => (
            <UpcomingCard
              key={index}
              isPlaceholder={true}
              navigation={navigation}
            />
          ))
        ) : stats.upcomingEvents.length > 0 ? (
          stats.upcomingEvents.map((event, index) => (
            <UpcomingCard
              key={index}
              title={event.description}
              subtitle={`Room ${event.classroom_id.slice(0, 4)}`}
              time={new Date(event.start_time).toLocaleTimeString()}
              type="class"
              navigation={navigation}
            />
          ))
        ) : (
          <PlaceholderCard
            title="No Upcoming Events"
            message={isStudent ? 
              "You don't have any upcoming classes scheduled." :
              "You don't have any classes scheduled for today."}
            icon="calendar-blank-outline"
          />
        )}
      </>
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDashboardData}
            colors={[THEME.accent]}
            tintColor={THEME.accent}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>
              {isStudent ? studentProfile?.matricNumber || 'Student' : 'Lecturer'}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Icon name="account-circle" size={40} color={THEME.accent} />
          </TouchableOpacity>
        </View>

        {renderContent()}
      </ScrollView>

      <ClassListModal
        visible={showClassModal}
        onClose={() => setShowClassModal(false)}
        classes={availableClasses}
        onSelect={handleClassSelect}
        loading={modalLoading}
        title="Available Classes"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 16,
    color: THEME.textSecondary,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  statsGrid: {
    padding: 20,
    gap: 16,
  },
  statCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
  },
  placeholderValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginLeft: 8,
  },
  upcomingCard: {
    backgroundColor: THEME.card,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingCardPlaceholder: {
    backgroundColor: THEME.cardDark,
    opacity: 0.7,
  },
  upcomingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upcomingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  upcomingSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  upcomingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingTime: {
    fontSize: 14,
    color: THEME.accent,
    marginRight: 8,
  },
  placeholderText: {
    height: 16,
    backgroundColor: THEME.card,
    borderRadius: 4,
    marginVertical: 4,
    width: '80%',
  },
  placeholderCard: {
    backgroundColor: THEME.card,
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 16,
    textAlign: 'center',
  },
  placeholderMessage: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: THEME.accent,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardDark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
  },
  modalLoader: {
    padding: 20,
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardDark,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  classSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  emptyListText: {
    textAlign: 'center',
    color: THEME.textSecondary,
    padding: 20,
  },
});

export default DashboardScreen;