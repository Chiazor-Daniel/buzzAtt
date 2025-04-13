import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { createProfile, loginUser } from '../apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SCREEN_NAMES } from '../navigation/config';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

interface ProfileCreationModalProps {
  visible: boolean;
  onClose: () => void;
  email: string;
  password: string;
}

interface TokenLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

const TokenLoginModal: React.FC<TokenLoginModalProps> = ({ visible, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTokenLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({
        username: email,  
        password,
        client_id: 'string',
        client_secret: 'string',
        grant_type: 'password',
        scope: ''
      });
      onLoginSuccess(response.access_token);
    } catch (error) {
      Alert.alert(
        'Login Failed',
        'Failed to get token for profile creation. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Login for Profile Creation</Text>
          <Text style={styles.modalSubtitle}>
            Please enter your credentials to get the token needed for profile creation
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={THEME.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={THEME.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleTokenLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME.text} />
            ) : (
              <Text style={styles.buttonText}>Get Token</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TokenLoginModal;

const ProfileCreationModal: React.FC<ProfileCreationModalProps> = ({ visible, onClose, email, password }) => {
  const [formData, setFormData] = useState({
    profileType: 'student',
    matricNumber: '',
    staffId: '',
    facultyId: '',
    departmentId: '',
    phoneNumber: '',
    dateOfBirth: '',
  });

  const [isTokenLoginVisible, setIsTokenLoginVisible] = useState(false);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!token) {
      setIsTokenLoginVisible(true);
      return;
    }

    if (!formData.facultyId || !formData.departmentId) {
      Alert.alert('Error', 'Faculty and Department are required');
      return;
    }

    if (formData.profileType === 'student' && !formData.matricNumber) {
      Alert.alert('Error', 'Matric Number is required for students');
      return;
    }

    if (formData.profileType === 'lecturer' && !formData.staffId) {
      Alert.alert('Error', 'Staff ID is required for lecturers');
      return;
    }

    setIsLoading(true);
    try {
      await AsyncStorage.setItem('access_token', token);

      const profileData = {
        student_profile: formData.profileType === 'student' ? {
          matric_number: formData.matricNumber,
          device_id: 'device_id_here',
          faculty_id: formData.facultyId,
          department_id: formData.departmentId,
          phone_number: formData.phoneNumber,
          date_of_birth: formData.dateOfBirth
        } : undefined,
        lecturer_profile: formData.profileType === 'lecturer' ? {
          staff_id: formData.staffId,
          faculty_id: formData.facultyId,
          department_id: formData.departmentId,
          phone_number: formData.phoneNumber,
          date_of_birth: formData.dateOfBirth
        } : undefined
      };

      await createProfile(formData.profileType, profileData);

      Alert.alert(
        'Profile Created',
        'Your profile has been created successfully. You can now proceed to login.',
        [{
          text: 'Login',
          onPress: () => {
            onClose();
            // Navigate to login screen
            navigation.replace(SCREEN_NAMES.LOGIN);
          }
        }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to create profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenLoginSuccess = (newToken: string) => {
    setToken(newToken);
    setIsTokenLoginVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Profile</Text>
          <Text style={styles.modalSubtitle}>
            Please select your profile type and fill in the required details
          </Text>

          <View style={styles.profileTypeContainer}>
            <Text style={styles.sectionTitle}>Profile Type</Text>
            <View style={styles.profileTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.profileTypeButton,
                  formData.profileType === 'student' && styles.profileTypeButtonActive
                ]}
                onPress={() => setFormData({ ...formData, profileType: 'student' })}
              >
                <Text style={[
                  styles.profileTypeButtonText,
                  formData.profileType === 'student' && styles.profileTypeButtonTextActive
                ]}>
                  Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.profileTypeButton,
                  formData.profileType === 'lecturer' && styles.profileTypeButtonActive
                ]}
                onPress={() => setFormData({ ...formData, profileType: 'lecturer' })}
              >
                <Text style={[
                  styles.profileTypeButtonText,
                  formData.profileType === 'lecturer' && styles.profileTypeButtonTextActive
                ]}>
                  Lecturer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formContainer}>
            {formData.profileType === 'student' && (
              <TextInput
                style={styles.input}
                placeholder="Matric Number"
                placeholderTextColor={THEME.textSecondary}
                value={formData.matricNumber}
                onChangeText={(text) => setFormData({ ...formData, matricNumber: text })}
              />
            )}

            {formData.profileType === 'lecturer' && (
              <TextInput
                style={styles.input}
                placeholder="Staff ID"
                placeholderTextColor={THEME.textSecondary}
                value={formData.staffId}
                onChangeText={(text) => setFormData({ ...formData, staffId: text })}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Faculty ID"
              placeholderTextColor={THEME.textSecondary}
              value={formData.facultyId}
              onChangeText={(text) => setFormData({ ...formData, facultyId: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Department ID"
              placeholderTextColor={THEME.textSecondary}
              value={formData.departmentId}
              onChangeText={(text) => setFormData({ ...formData, departmentId: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (Optional)"
              placeholderTextColor={THEME.textSecondary}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD)"
              placeholderTextColor={THEME.textSecondary}
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleCreateProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME.text} />
            ) : (
              <Text style={styles.buttonText}>Create Profile</Text>
            )}
          </TouchableOpacity>

          <TokenLoginModal
            visible={isTokenLoginVisible}
            onClose={() => setIsTokenLoginVisible(false)}
            onLoginSuccess={handleTokenLoginSuccess}
          />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export { ProfileCreationModal };

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.dark,
    padding: SPACING.lg,
    borderRadius: 8,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.bold,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.md,
    color: THEME.textSecondary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    color: THEME.text,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  profileTypeContainer: {
    marginBottom: SPACING.xl,
  },
  profileTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  profileTypeButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    marginHorizontal: SPACING.sm,
    backgroundColor: THEME.card,
    alignItems: 'center',
  },
  profileTypeButtonActive: {
    backgroundColor: THEME.accent,
  },
  profileTypeButtonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  profileTypeButtonTextActive: {
    color: THEME.text,
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: THEME.accent,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  cancelButtonText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
});
