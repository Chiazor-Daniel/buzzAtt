import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { loginUser, fetchUserProfile } from '../apis'; // Assumes fetchUserProfile is now exported from apis/index.ts
// Import your UserProfile type, StudentProfile, LecturerProfile types if available
// e.g., import { UserProfile, StudentProfileData, LecturerProfileData } from '../types';

// Placeholder types if not defined elsewhere - replace with actual types
type UserProfile = { id: string; first_name: string; last_name: string; email: string; role: 'student' | 'lecturer'; faculty_id?: string; phone_number?: string; department_id?: string; staff_id?: string; date_of_birth?: string; user_id?: string; };
type StudentProfileData = { matricNumber: string | null; deviceId: string; facultyId: string | null; departmentId: string | null; phoneNumber: string | null; dateOfBirth: string | null;};
type LecturerProfileData = { facultyId: string | null; phoneNumber: string | null; departmentId: string | null; staffId: string | null; dateOfBirth: string | null; id?: string; userId?: string;};


export const useAuthHandler = (
    onLoginSuccess: () => void,
    onQuickUseSuccess?: () => void // Optional callback for quick use
) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setToken, setStudentProfile, setLecturerProfile, setMacAddress } = useAuthStore();
  const { setIsStudent } = useUIStore();

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const loginResponse = await loginUser({ username: email, password });

      if (loginResponse?.access_token) {
        const token = loginResponse.access_token;
        setToken(token); // Update Zustand
        await AsyncStorage.setItem('access_token', token);

        const profile: UserProfile = await fetchUserProfile(token); // Use the new service

        if (profile) {
          const isStudentRole = profile.role === 'student';
          
          setUser({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            profileType: profile.role,
          });
          setIsStudent(isStudentRole);
          await AsyncStorage.setItem('user', JSON.stringify({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            profileType: profile.role,
          }));

          if (isStudentRole) {
            const deviceId = await DeviceInfo.getUniqueId();
            const studentProfileData: StudentProfileData = {
              matricNumber: null, // Assuming matricNumber isn't part of the initial profile response
              deviceId: deviceId,
              facultyId: null,    // Populate these if available from profile or another source
              departmentId: null,
              phoneNumber: null,
              dateOfBirth: null,
            };
            setStudentProfile(studentProfileData);
            await AsyncStorage.setItem('studentProfile', JSON.stringify(studentProfileData));
          } else if (profile.role === 'lecturer') {
            const lecturerProfileData: LecturerProfileData = {
              facultyId: profile.faculty_id || '', // Fallback to empty string if null
              phoneNumber: profile.phone_number || '', // Fallback to empty string if null
              departmentId: profile.department_id || '', // Fallback to empty string if null
              staffId: profile.staff_id || '', // Fallback to empty string if null
              dateOfBirth: profile.date_of_birth || '', // Fallback to empty string if null
              // id: profile.id, // This is user ID, lecturer profile might have its own ID structure
              // userId: profile.user_id, // This is redundant if user.id is the same
            };
            setLecturerProfile(lecturerProfileData as any); // Using 'as any' temporarily if store type is strict and not updated yet. Ideal: ensure LecturerProfileData matches store type.
            await AsyncStorage.setItem('lecturerProfile', JSON.stringify(lecturerProfileData));
          }

          try { // Getting MAC address can fail on some devices/simulators
            const macAddress = await DeviceInfo.getMacAddress();
            setMacAddress(macAddress);
            await AsyncStorage.setItem('macAddress', macAddress);
          } catch (macError) {
            console.warn('Could not retrieve MAC address:', macError);
            setMacAddress(null); // Set to null or handle as per your app's needs
            await AsyncStorage.removeItem('macAddress'); // Or set to empty/null string
          }
          
          onLoginSuccess();
        } else {
            // This case should ideally be handled by fetchUserProfile throwing an error
            throw new Error('Profile data not found after token test.');
        }
      } else {
        throw new Error(loginResponse?.detail || 'Login failed: No access token received.');
      }
    } catch (err: any) {
      console.error('Login Failed in Hook:', err);
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, setToken, setUser, setIsStudent, setStudentProfile, setLecturerProfile, setMacAddress, onLoginSuccess]);

  const handleQuickUse = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dummyToken = 'dummy-token-quick-use'; // Make it more distinct
      const dummyUser = { id: 'quick-test-id', name: 'Quick Test User', email: 'quicktest@example.com', profileType: 'student' as const };
      const deviceId = await DeviceInfo.getUniqueId();
      const dummyStudentProfile: StudentProfileData = { matricNumber: 'QUICK123', deviceId, facultyId: 'F01', departmentId: 'D01', phoneNumber: '090000000', dateOfBirth: '2000-01-01' };

      setToken(dummyToken);
      setUser(dummyUser);
      setIsStudent(true);
      setStudentProfile(dummyStudentProfile);

      await AsyncStorage.setItem('access_token', dummyToken);
      await AsyncStorage.setItem('user', JSON.stringify(dummyUser));
      await AsyncStorage.setItem('studentProfile', JSON.stringify(dummyStudentProfile));
      
      try {
          const macAddress = await DeviceInfo.getMacAddress();
          setMacAddress(macAddress);
          await AsyncStorage.setItem('macAddress', macAddress);
      } catch (macError) {
          console.warn('Could not retrieve MAC address (Quick Use):', macError);
          setMacAddress(null);
          await AsyncStorage.removeItem('macAddress');
      }

      if (onQuickUseSuccess) onQuickUseSuccess();
      else onLoginSuccess(); // Fallback to onLoginSuccess if no specific quick use callback

    } catch (err: any) {
      console.error('Quick Use Failed in Hook:', err);
      setError(err.message || 'Failed to set up quick use.');
    } finally {
      setIsLoading(false);
    }
  }, [setToken, setUser, setIsStudent, setStudentProfile, setMacAddress, onLoginSuccess, onQuickUseSuccess]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error, // Expose error state for UI
    handleLogin,
    handleQuickUse,
  };
}; 