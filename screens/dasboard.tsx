import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useUIStore } from '../store/uiStore';
import StudentDashboard from '../components/student';
import LecturerDashboard from '../components/lecturer';
import RoleSelectionModal from '../components/RoleSelectionModal';

const DashboardScreen = ({ navigation, route }: any) => {
  const { isStudent } = useUIStore();
  const [showModal, setShowModal] = useState(route?.params?.fromLogin || (isStudent === null || isStudent === undefined ? true : !isStudent) );

  useEffect(() => {
    if (route?.params?.fromLogin) {
      setShowModal(true);
    } else if (isStudent !== null && isStudent !== undefined) {
      setShowModal(false);
    }
  }, [route?.params?.fromLogin, isStudent]);

  const handleModalRoleSelected = () => {
    setShowModal(false);
  };

  const handleModalClose = () => {
    if (!route?.params?.fromLogin && (isStudent !== null && isStudent !== undefined)) {
        setShowModal(false);
    }
  };

  if (showModal) {
    return (
      <View style={styles.container}>
        <RoleSelectionModal
          visible={showModal}
          onClose={handleModalClose}
          onRoleSelect={handleModalRoleSelected}
        />
      </View>
    );
  }

  return isStudent ? <StudentDashboard navigation={navigation} /> : <LecturerDashboard navigation={navigation} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DashboardScreen;