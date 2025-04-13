import React from 'react';
import { useUIStore } from '../store/uiStore';
import StudentDashboard from '../components/student';
import LecturerDashboard from '../components/lecturer';

const DashboardScreen = ({ navigation }) => {
  const { isStudent } = useUIStore();

  return isStudent ? <StudentDashboard navigation={navigation} /> : <LecturerDashboard navigation={navigation} />;
};

export default DashboardScreen;