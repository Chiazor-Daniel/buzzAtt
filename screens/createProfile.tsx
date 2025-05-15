import React, { useEffect } from 'react';
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
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { SCREEN_NAMES } from '../navigation/config';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import {
  useCreateProfileHandler,
  ProfileFormData,
  ProfileType
} from '../custom-hooks/useCreateProfileHandler';

type CreateProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, typeof SCREEN_NAMES.CREATE_PROFILE>;
};

const CreateProfileScreen: React.FC<CreateProfileScreenProps> = ({ navigation }) => {
  const {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleProfileTypeChange,
    handleSubmit,
    clearError,
  } = useCreateProfileHandler({
    onCreateProfileSuccess: () => {
      Alert.alert(
        'Success',
        'Profile created successfully! You can now use all features of the app.',
        [{
          text: 'OK',
          onPress: () => navigation.goBack()
        }]
      );
    },
  });

  useEffect(() => {
    if (error) {
      const errorMessage: string = typeof error === 'string' ? error : 'An unknown error occurred.';
      Alert.alert(
        'Error Creating Profile', 
        errorMessage, 
        [{ text: 'OK', onPress: clearError }], 
        { cancelable: false }
      );
    }
  }, [error, clearError]);

  const renderProfileTypeSection = () => {
    return (
      <View style={styles.profileTypeContainer}>
        <Text style={styles.sectionTitle}>I am a...</Text>
        <View style={styles.profileTypeButtons}>
          <TouchableOpacity
            style={[
              styles.profileTypeButton,
              formData.profileType === 'student' && styles.profileTypeButtonActive,
            ]}
            onPress={() => handleProfileTypeChange('student')}
          >
            <Text
              style={[
                styles.profileTypeButtonText,
                formData.profileType === 'student' && styles.profileTypeButtonTextActive,
              ]}
            >
              Student
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.profileTypeButton,
              formData.profileType === 'lecturer' && styles.profileTypeButtonActive,
            ]}
            onPress={() => handleProfileTypeChange('lecturer')}
          >
            <Text
              style={[
                styles.profileTypeButtonText,
                formData.profileType === 'lecturer' && styles.profileTypeButtonTextActive,
              ]}
            >
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
            onChangeText={(text) => handleInputChange('matricNumber', text)}
          />
        )}

        {formData.profileType === 'lecturer' && (
          <TextInput
            style={styles.input}
            placeholder="Staff ID"
            placeholderTextColor={THEME.textSecondary}
            value={formData.staffId}
            onChangeText={(text) => handleInputChange('staffId', text)}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Faculty ID (e.g., F01)"
          placeholderTextColor={THEME.textSecondary}
          value={formData.facultyId}
          onChangeText={(text) => handleInputChange('facultyId', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Department ID (e.g., D001)"
          placeholderTextColor={THEME.textSecondary}
          value={formData.departmentId}
          onChangeText={(text) => handleInputChange('departmentId', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number (e.g., +2348012345678)"
          placeholderTextColor={THEME.textSecondary}
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          placeholderTextColor={THEME.textSecondary}
          value={formData.dateOfBirth}
          onChangeText={(text) => handleInputChange('dateOfBirth', text)}
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
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Select your role and fill in the details to get started.
          </Text>
        </View>

        {renderProfileTypeSection()}
        {renderFormInputs()}

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit} 
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
            onPress={() => navigation.replace(SCREEN_NAMES.LOGIN, { userType: formData.profileType })}
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
    backgroundColor: THEME.darker,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    color: THEME.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  profileTypeContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: THEME.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  profileTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  profileTypeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.accent,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  profileTypeButtonActive: {
    backgroundColor: THEME.accent,
  },
  profileTypeButtonText: {
    color: THEME.accent,
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
  },
  profileTypeButtonTextActive: {
    color: THEME.text,
  },
  formContainer: {
    marginBottom: SPACING.lg,
  },
  input: {
    backgroundColor: THEME.dark,
    color: THEME.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: THEME.card,
  },
  button: {
    backgroundColor: THEME.accent,
    padding: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: THEME.accentLight,
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
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
