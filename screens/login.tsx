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
import { loginUser, getProfile } from '../apis';
import { useAuthStore } from '../store'; // Zustand store
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

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

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('test@gmail.com');
  const [password, setPassword] = useState('test123456');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser, setToken, setIsStudent, setStudentProfile } = useAuthStore();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser({ username, password });

      if (response?.access_token) {
        const token = response.access_token;
        setToken(token);
        await AsyncStorage.setItem('access_token', token);

        const profile = await getProfile(token);

        if (profile) {
          const isStudent = profile.profile_type === 'student';

          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            profileType: profile.profile_type,
          });
          setIsStudent(isStudent);

          await AsyncStorage.setItem(
            'user',
            JSON.stringify({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              profileType: profile.profile_type,
            })
          );

          if (isStudent) {
            const studentProfile = {
              matricNumber: profile.matric_number,
              deviceId: profile.device_id,
              facultyId: profile.faculty_id,
              departmentId: profile.department_id,
              phoneNumber: profile.phone_number,
              dateOfBirth: profile.date_of_birth,
            };

            setStudentProfile(studentProfile);
            await AsyncStorage.setItem('studentProfile', JSON.stringify(studentProfile));
            console.log('Profile saved');
          }

          // Save MAC address (optional)
          const macAddress = await DeviceInfo.getMacAddress();
          await AsyncStorage.setItem('macAddress', macAddress);

          // Reset navigation stack to Main
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }
    } catch (error) {
      console.error('Login Failed:', error);
      Alert.alert('Error', 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickUse = async () => {
    setIsLoading(true);

    try {
      // Generate dummy data
      const dummyToken = 'access-token';
      const dummyUser = {
        id: 'me123',
        name: 'Bruce Wayne',
        email: 'dummy@example.com',
        profileType: 'student', // or 'lecturer'
      };
      const dummyStudentProfile = {
        matricNumber: '4456i',
        deviceId: await DeviceInfo.getUniqueId(),
        facultyId: 'faculty-id',
        departmentId: '80-809999dnein',
        phoneNumber: '123-456-7890',
        dateOfBirth: '2000-01-01',
      };

      // Set Zustand store
      setToken(dummyToken);
      setUser(dummyUser);
      setIsStudent(dummyUser.profileType === 'student');
      setStudentProfile(dummyStudentProfile);

      // Save to AsyncStorage
      await AsyncStorage.setItem('access_token', dummyToken);
      await AsyncStorage.setItem('user', JSON.stringify(dummyUser));
      await AsyncStorage.setItem('studentProfile', JSON.stringify(dummyStudentProfile));

      // Save MAC address (optional)
      const macAddress = await DeviceInfo.getMacAddress();
      await AsyncStorage.setItem('macAddress', macAddress);

      // Reset navigation stack to Main
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Quick Use Failed:', error);
      Alert.alert('Error', 'Failed to set up quick use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back! Please sign in to continue.</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={THEME.textSecondary}
            value={username}
            onChangeText={setUsername}
            keyboardType="default"
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

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={THEME.text} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickUseButton} onPress={handleQuickUse} disabled={isLoading}>
          <Text style={styles.quickUseButtonText}>Quick Use</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Register</Text>
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
    marginBottom: 16,
  },
  buttonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
  quickUseButton: {
    backgroundColor: THEME.card,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  quickUseButtonText: {
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

export default LoginScreen;