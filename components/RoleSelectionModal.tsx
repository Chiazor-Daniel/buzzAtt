import React from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { useUIStore } from '../store/uiStore';

interface RoleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onRoleSelect: (isStudent: boolean) => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ visible, onClose, onRoleSelect }) => {
  const { setIsStudent } = useUIStore();

  const handleSelect = (isStudentRole: boolean) => {
    setIsStudent(isStudentRole);
    onRoleSelect(isStudentRole); // Inform parent about selection
    // onClose(); // Parent will control visibility based on onRoleSelect
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
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
              onPress={() => handleSelect(true)}
            >
              <Text style={styles.buttonText}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.lecturerButton]} 
              onPress={() => handleSelect(false)}
            >
              <Text style={styles.buttonText}>Lecturer</Text>
            </TouchableOpacity>
            {/* Optional: Add a close button if direct closing without selection is needed */}
            {/* <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Fallback for blur if needed
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: THEME.darker,
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
    backgroundColor: THEME.accent, // Consider a different color for distinction if desired
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
  },
  // Optional close button styles
  /*
  closeButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  */
});

export default RoleSelectionModal; 