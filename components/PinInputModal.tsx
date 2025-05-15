import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme'; // Adjust path if needed

interface PinInputModalProps {
  visible: boolean;
  onClose: () => void;
  pin: string;
  onPinChange: (text: string) => void;
  onSubmit: () => void;
  error?: string;
  isSubmitDisabled?: boolean;
}

export const PinInputModal: React.FC<PinInputModalProps> = ({
  visible,
  onClose,
  pin,
  onPinChange,
  onSubmit,
  error,
  isSubmitDisabled,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter PIN</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalText}>Please enter your PIN to mark attendance. (Default: 1234)</Text>

          <TextInput
            style={styles.pinInput}
            placeholder="----"
            placeholderTextColor={THEME.textSecondary + '80'} // Slightly more transparent placeholder
            value={pin}
            onChangeText={onPinChange}
            keyboardType="numeric"
            secureTextEntry={true}
            maxLength={4}
            autoFocus={true} // Auto-focus when modal opens
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.pinButton, isSubmitDisabled && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={isSubmitDisabled}
          >
            <Text style={styles.pinButtonText}>Verify PIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '85%', // Slightly wider
    maxWidth: 340, // Max width for larger screens
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  modalText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.lg,
    fontFamily: FONTS.regular,
    textAlign: 'center', // Center align instruction
  },
  pinInput: {
    backgroundColor: THEME.darker, // Consistent with other inputs
    color: THEME.text,
    paddingVertical: SPACING.md, // Adjusted padding
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    fontSize: FONT_SIZES.xl, // Larger PIN characters
    fontFamily: FONTS.regular, // Monospaced if available - Fallback to regular
    textAlign: 'center',
    letterSpacing: 12, // Increased letter spacing
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: THEME.accent + '60', // Accent border
  },
  errorText: {
    color: 'red', // Use theme danger or fallback - Fallback to red
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  pinButton: {
    backgroundColor: THEME.accent,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center', // Center text
  },
  pinButtonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold, // Bold button text
  },
  buttonDisabled: {
    opacity: 0.5,
  },
}); 