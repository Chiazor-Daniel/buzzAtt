import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store';
import { getStudentClassroom, getCourses, getAttendance } from '../apis';

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
    {trend && (
      <View style={styles.trendContainer}>
        <Icon 
          name={trend > 0 ? 'trending-up' : 'trending-down'} 
          size={16} 
          color={trend > 0 ? THEME.success : THEME.error} 
        />
        <Text style={[styles.trendText, { color: trend > 0 ? THEME.success : THEME.error }]}>
          {Math.abs(trend)}% from last month
        </Text>
      </View>
    )}
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

export function DashboardScreen({navigation}) {
  const { isStudent, studentProfile } = useAuthStore();
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendanceRate: 0,
    upcomingEvents: [],
  });

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

  const fetchDashboardData = async () => {
    try {
      if (isStudent) {
        const classes = await getStudentClassroom();
        // Process student data
      } else {
        const courses = await getCourses();
        const attendance = await getAttendance();
        // Process lecturer data
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const renderStudentDashboard = () => (
    <>
      <View style={styles.statsGrid}>
        <StatCard
          icon="calendar-check"
          title="Attendance Rate"
          value="87%"
          trend={2.5}
          color={THEME.success}
        />
        <StatCard
          icon="book-open-page-variant"
          title="Total Classes"
          value="24"
          color={THEME.accent}
        />
        <StatCard
          icon="clock-alert"
          title="Missed Classes"
          value="3"
          trend={-1.2}
          color={THEME.error}
        />
      </View>
      <View style={styles.sectionHeader}>
        <Icon name="calendar-clock" size={24} color={THEME.accent} />
        <Text style={styles.sectionTitle}>Upcoming Classes</Text>
      </View>
      <UpcomingCard
        title="Software Engineering"
        subtitle="Room 401"
        time="9:00 AM"
        type="class"
        navigation={navigation}
      />
      <UpcomingCard
        title="Database Systems"
        subtitle="Lab 3"
        time="2:30 PM"
        type="class"
        navigation={navigation}
      />
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
          value="92%"
          trend={3.8}
          color={THEME.success}
        />
        <StatCard
          icon="book-multiple"
          title="Active Courses"
          value="4"
          color={THEME.warning}
        />
      </View>
      <View style={styles.sectionHeader}>
        <Icon name="calendar-check" size={24} color={THEME.accent} />
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
      </View>
      <UpcomingCard
        title="CSC 301 Lecture"
        subtitle="45 Students"
        time="10:00 AM"
        type="class"
        navigation={navigation}
      />
      <UpcomingCard
        title="Attendance Session"
        subtitle="CSC 405"
        time="2:00 PM"
        type="attendance"
        navigation={navigation}
      />
    </>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>
            {!isStudent ? studentProfile?.matricNumber || 'Student' : 'Lecturer'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="account-circle" size={40} color={THEME.accent} />
        </TouchableOpacity>
      </View>
      {!isStudent ? renderStudentDashboard() : renderLecturerDashboard()}
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
});