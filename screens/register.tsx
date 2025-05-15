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
import { SCREEN_NAMES } from '../navigation/config';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { useRegistrationHandler } from '../custom-hooks/useRegistrationHandler';
import { StackNavigationProp } from '@react-navigation/stack';

// Define a ParamList relevant to the auth flow
type AuthStackParamList = {
  [SCREEN_NAMES.LOGIN]: undefined; // Navigates to Login
  [SCREEN_NAMES.REGISTER]: undefined; // Current screen
  // Add other auth-flow screens if necessary, e.g., ForgotPassword
};

interface RegisterScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, typeof SCREEN_NAMES.REGISTER>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleRegister,
    clearError,
  } = useRegistrationHandler({
    onRegistrationSuccess: () => {
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully. You can now login and create your profile.',
        [
          {
            text: 'Login',
            onPress: () => navigation.replace(SCREEN_NAMES.LOGIN)
          }
        ],
        { cancelable: false }
      );
    },
  });

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Create an account to get started.</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={THEME.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="First Name (Optional)"
            placeholderTextColor={THEME.textSecondary}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name (Optional)"
            placeholderTextColor={THEME.textSecondary}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min. 8 characters)"
            placeholderTextColor={THEME.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={THEME.text} />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate(SCREEN_NAMES.LOGIN)}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.7,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: THEME.dark,
    color: THEME.text,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: THEME.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: THEME.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default RegisterScreen;