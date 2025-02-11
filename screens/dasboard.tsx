import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getStudentClassroom, getCourses, getSchedules } from '../apis';

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
  warning: '#FFC107',
};

const StatCard = ({ icon, title, value, trend, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const UpcomingCard = ({ title, subtitle, time, type, navigation }) => (
  <TouchableOpacity
    style={styles.upcomingCard}
    onPress={() => navigation.navigate('Student', { title, subtitle, time, type })}
  >
    <View style={styles.upcomingLeft}>
      <Icon
        name={type === 'class' ? 'book-open-variant' : 'clock-check'}
        size={24}
        color={THEME.accent}
      />
      <View style={styles.upcomingInfo}>
        <Text style={styles.upcomingTitle}>{title}</Text>
        <Text style={styles.upcomingSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <View style={styles.upcomingRight}>
      <Text style={styles.upcomingTime}>{time}</Text>
      <Icon name="chevron-right" size={20} color={THEME.textSecondary} />
    </View>
  </TouchableOpacity>
);

export function DashboardScreen({ navigation }) {
  const { isStudent, studentProfile } = useAuthStore();
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendanceRate: 0,
    upcomingEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
      // Keep existing stats instead of clearing them
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const renderStudentDashboard = () => (
    <>
      <View style={styles.statsGrid}>
        <StatCard
          icon="calendar-check"
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          color={THEME.success}
        />
        <StatCard
          icon="book-open-page-variant"
          title="Total Classes"
          value={stats.totalClasses}
          color={THEME.accent}
        />
        <StatCard
          icon="clock-alert"
          title="Missed Classes"
          value="0"
          color={THEME.error}
        />
      </View>
      <View style={styles.sectionHeader}>
        <Icon name="calendar-clock" size={24} color={THEME.accent} />
        <Text style={styles.sectionTitle}>Upcoming Classes</Text>
      </View>
      {error ? (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={20} color={THEME.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchDashboardData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {stats.upcomingEvents.length > 0 ? (
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
        <Text style={styles.noDataText}>No upcoming classes found.</Text>
      )}
    </>
  );

  const renderLecturerDashboard = () => (
    <>
      <View style={styles.statsGrid}>
        <StatCard
          icon="account-group"
          title="Total Students"
          value="156"
          color={THEME.accent}
        />
        <StatCard
          icon="chart-line"
          title="Avg. Attendance"
          value={`${stats.attendanceRate}%`}
          color={THEME.success}
        />
        <StatCard
          icon="book-multiple"
          title="Active Courses"
          value={stats.totalClasses}
          color={THEME.warning}
        />
      </View>
      <View style={styles.sectionHeader}>
        <Icon name="calendar-check" size={24} color={THEME.accent} />
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
      </View>
      {error ? (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={20} color={THEME.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchDashboardData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {stats.upcomingEvents.length > 0 ? (
        stats.upcomingEvents.map((event, index) => (
          <UpcomingCard
            key={index}
            title={event.description}
            subtitle={`${event.classroom_id.slice(0, 4)} Students`}
            time={new Date(event.start_time).toLocaleTimeString()}
            type="class"
            navigation={navigation}
          />
        ))
      ) : (
        <Text style={styles.noDataText}>No schedules found for today.</Text>
      )}
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
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
      {isStudent ? renderStudentDashboard() : renderLecturerDashboard()}
    </ScrollView>
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
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
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
  upcomingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingInfo: {
    marginLeft: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.darker,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.darker,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: THEME.text,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: THEME.accent,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: THEME.text,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: THEME.error,
    marginLeft: 8,
  },
  retryText: {
    fontSize: 14,
    color: THEME.accent,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DashboardScreen;