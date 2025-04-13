import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { createProfile } from '../apis';
import { useAuthStore } from '../store/authStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { SCREEN_NAMES } from '../navigation/config';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

type CreateProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, typeof SCREEN_NAMES.CREATE_PROFILE>;
};

const CreateProfileScreen: React.FC<CreateProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    profileType: 'student',
    matricNumber: '',
    staffId: '',
    facultyId: '',
    departmentId: '',
    phoneNumber: '',
    dateOfBirth: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateProfile = async () => {
    if (!formData.facultyId) {
      Alert.alert('Error', 'Please select a faculty');
      return;
    }

    if (!formData.departmentId) {
      Alert.alert('Error', 'Please select a department');
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

    if (formData.phoneNumber) {
      // Basic phone number validation
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        Alert.alert('Error', 'Please enter a valid phone number (e.g., +2348012345678)');
        return;
      }
    }

    setIsLoading(true);
    try {
      const profileData = {
        student_profile: formData.profileType === 'student' ? {
          matric_number: formData.matricNumber,
          device_id: 'device_id_here', // This should be the actual device ID
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
        'Success',
        'Profile created successfully! You can now use all features of the app.',
        [{
          text: 'OK',
          onPress: () => navigation.goBack()
        }]
      );
    } catch (error) {
      console.error('Create profile error:', error);
      let errorMessage = 'Failed to create profile. Please try again.';
      
      if (error.response?.data?.detail) {
        const errors = error.response.data.detail;
        if (Array.isArray(errors)) {
          errorMessage = errors.map(err => {
            if (err.loc?.includes('faculty_id') || err.loc?.includes('department_id')) {
              return 'Please select valid faculty and department IDs';
            }
            if (err.loc?.includes('phone_number')) {
              return 'Please enter a valid phone number format';
            }
            return err.msg;
          }).join('\n');
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
      }

      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileTypeChange = (type: 'student' | 'lecturer') => {
    setFormData(prev => ({ ...prev, profileType: type }));
  };

  const renderProfileTypeSection = () => {
    return (
      <View style={styles.profileTypeContainer}>
        <Text style={styles.sectionTitle}>Profile Type</Text>
        <View style={styles.profileTypeButtons}>
          <TouchableOpacity
            style={[
              styles.profileTypeButton,
              formData.profileType === 'student' && styles.profileTypeButtonActive
            ]}
            onPress={() => handleProfileTypeChange('student')}
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
            onPress={() => handleProfileTypeChange('lecturer')}
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
    );
  };

  const renderFormInputs = () => {
    return (
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
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Profile</Text>
          <Text style={styles.subtitle}>
            Please select your profile type and fill in the required details
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderProfileTypeSection()}
        {renderFormInputs()}

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

        {!isLoading && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.replace(SCREEN_NAMES.LOGIN)}
          >
            <Text style={styles.loginButtonText}>Already have a profile? Login</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.dark,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl * 2,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: THEME.textSecondary,
    fontFamily: FONTS.regular,
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  profileTypeContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    color: THEME.text,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.medium,
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
  input: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  errorContainer: {
    backgroundColor: '#ff6b6b',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#fff',
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
    opacity: 0.7,
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  loginButton: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loginButtonText: {
    color: THEME.accent,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
});

export default CreateProfileScreen;
