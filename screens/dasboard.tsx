import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useUIStore } from '../store/uiStore';
import StudentDashboard from '../components/sudent';
import LecturerDashboard from '../components/lecturer';
import { THEME } from '../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface DashboardScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { isStudent } = useUIStore();

  return (
    <View style={styles.container}>
      {isStudent ? (
        <StudentDashboard navigation={navigation} />
      ) : (
        <LecturerDashboard navigation={navigation} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.dark,
  },
});

export default DashboardScreen;