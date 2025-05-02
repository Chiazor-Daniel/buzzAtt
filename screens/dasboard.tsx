import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useUIStore } from '../store/uiStore';
import StudentDashboard from '../components/student';
import LecturerDashboard from '../components/lecturer';
import { BlurView } from '@react-native-community/blur';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

const DashboardScreen = ({ navigation, route }) => {
  const { isStudent, setIsStudent } = useUIStore();
  const [showModal, setShowModal] = useState(route?.params?.fromLogin || !isStudent);

  const handleRoleSelection = (role: boolean) => {
    setIsStudent(role);
    setShowModal(false);
  };

  if (showModal) {
    return (
      <View style={styles.container}>
        <Modal visible={showModal} transparent={true} animationType="fade">
          <BlurView 
            style={styles.blurContainer}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0,0,0,0.3)"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.title}>Choose Your Role</Text>
                <TouchableOpacity 
                  style={[styles.button, styles.studentButton]} 
                  onPress={() => handleRoleSelection(true)}
                >
                  <Text style={styles.buttonText}>Student</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.lecturerButton]} 
                  onPress={() => handleRoleSelection(false)}
                >
                  <Text style={styles.buttonText}>Lecturer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </View>
    );
  }

  return isStudent ? <StudentDashboard navigation={navigation} /> : <LecturerDashboard navigation={navigation} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: THEME.dark,
    borderRadius: 10,
    padding: SPACING.lg,
    elevation: 5,
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
    color: THEME.accent,
  },
  button: {
    padding: SPACING.md,
    borderRadius: 8,
    marginVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  studentButton: {
    backgroundColor: THEME.accent,
  },
  lecturerButton: {
    backgroundColor: THEME.accent,
  },
  buttonText: {
    color: THEME.white,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
  },
});

export default DashboardScreen;