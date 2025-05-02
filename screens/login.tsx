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
import { baseURL, loginUser } from '../apis';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { StackNavigationProp } from '@react-navigation/stack';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { SCREEN_NAMES } from '../navigation/config';
import ZeroconfTest from './ZeroconfTest';

type RootStackParamList = {
  [SCREEN_NAMES.LOGIN]: undefined;
  [SCREEN_NAMES.REGISTER]: undefined;
  [SCREEN_NAMES.MAIN_TABS]: undefined;
  ZeroconfTest: undefined;
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, typeof SCREEN_NAMES.LOGIN>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('test@gmail.com');
  const [password, setPassword] = useState('test123456');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser, setToken, setStudentProfile, setLecturerProfile, setMacAddress } = useAuthStore();
  const { setIsStudent } = useUIStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    setIsLoading(true);
  
    try {
      // First login to get the token
      const loginResponse = await loginUser({ username: email, password });
      console.log(loginResponse)
  
      if (loginResponse?.access_token) {
        const token = loginResponse.access_token;
        setToken(token);
        await AsyncStorage.setItem('access_token', token);
  
        // Test the token to get user profile
        const response = await fetch(
          `${baseURL}/auth/login/test-token`,
          {
            method: 'POST',
            headers: { 
              'accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log("response-token", response)
  
        if (!response.ok) {
          throw new Error('Failed to get user profile');
        }
  
        const profile = await response.json();
  
        if (profile) {
          const isStudent = profile.role === 'student';
  
          // Set user in Zustand store matching UserProfile type
          setUser({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            profileType: profile.role as 'student' | 'lecturer'
          });
  
          // Set isStudent based on role
          setIsStudent(isStudent);
  
          // Save user to AsyncStorage
          await AsyncStorage.setItem(
            'user',
            JSON.stringify({
              id: profile.id,
              name: `${profile.first_name} ${profile.last_name}`,
              email: profile.email,
              profileType: profile.role
            })
          );
  
          // If user is a student, set up student profile
          if (isStudent) {
            const deviceId = await DeviceInfo.getUniqueId();
            
            const studentProfile = {
              matricNumber: null,
              deviceId: deviceId,
              facultyId: null,
              departmentId: null,
              phoneNumber: null,
              dateOfBirth: null
            };
  
            setStudentProfile(studentProfile);
            await AsyncStorage.setItem('studentProfile', JSON.stringify(studentProfile));
          } else if (profile.role === 'lecturer') {
            // If user is a lecturer, set up lecturer profile
            const lecturerProfile = {
              facultyId: profile.faculty_id,
              phoneNumber: profile.phone_number,
              departmentId: profile.department_id,
              staffId: profile.staff_id,
              dateOfBirth: profile.date_of_birth,
              id: profile.id,
              userId: profile.user_id
            };
  
            setLecturerProfile(lecturerProfile);
            await AsyncStorage.setItem('lecturerProfile', JSON.stringify(lecturerProfile));
          }
  
          // Save MAC address
          const macAddress = await DeviceInfo.getMacAddress();
          setMacAddress(macAddress);
          await AsyncStorage.setItem('macAddress', macAddress);
  
          // Reset navigation stack to MainTabs with fromLogin parameter
          navigation.reset({
            index: 0,
            routes: [{ 
              name: SCREEN_NAMES.MAIN_TABS,
              params: { fromLogin: true }
            }],
          });
        }
      }
    } catch (error) {
      console.error('Login Failed:', error);
      Alert.alert('Error', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickUse = async () => {
    setIsLoading(true);

    try {
      const dummyToken = 'dummy-token';
      const dummyUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@gmail.com',
        profileType: 'student' as const
      };

      const deviceId = await DeviceInfo.getUniqueId();
      const dummyStudentProfile = {
        matricNumber: null,
        deviceId: deviceId,
        facultyId: null,
        departmentId: null,
        phoneNumber: null,
        dateOfBirth: null
      };

      // Set Zustand stores
      setToken(dummyToken);
      setUser(dummyUser);
      setIsStudent(true);
      setStudentProfile(dummyStudentProfile);

      // Save to AsyncStorage
      await AsyncStorage.setItem('access_token', dummyToken);
      await AsyncStorage.setItem('user', JSON.stringify(dummyUser));
      await AsyncStorage.setItem('studentProfile', JSON.stringify(dummyStudentProfile));

      const macAddress = await DeviceInfo.getMacAddress();
      setMacAddress(macAddress);
      await AsyncStorage.setItem('macAddress', macAddress);

      navigation.reset({
        index: 0,
        routes: [{ name: SCREEN_NAMES.MAIN_TABS }],
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

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate(SCREEN_NAMES.REGISTER)}
        >
          <Text style={styles.registerButtonText}>
            Don't have an account? <Text style={styles.registerButtonTextBold}>Register</Text>
          </Text>
        </TouchableOpacity>

       
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
  inputContainer: {
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
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  quickUseButton: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  quickUseButtonText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerButtonText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  registerButtonTextBold: {
    color: THEME.accent,
    fontFamily: FONTS.bold,
  },
});

export default LoginScreen;