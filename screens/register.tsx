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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  success: '#4CAF50',
  error: '#F44336',
};

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // Add your registration logic here
    if (firstName && lastName && matricNumber && department && faculty && password) {
      Alert.alert('Registration Successful', 'You can now log in.');
      navigation.navigate('Login'); // Navigate to the Login screen
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

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
            placeholder="First Name"
            placeholderTextColor={THEME.textSecondary}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor={THEME.textSecondary}
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Matric Number (e.g., FUO/20/CSI/1334)"
            placeholderTextColor={THEME.textSecondary}
            value={matricNumber}
            onChangeText={setMatricNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Department"
            placeholderTextColor={THEME.textSecondary}
            value={department}
            onChangeText={setDepartment}
          />
          <TextInput
            style={styles.input}
            placeholder="Faculty"
            placeholderTextColor={THEME.textSecondary}
            value={faculty}
            onChangeText={setFaculty}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={THEME.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
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