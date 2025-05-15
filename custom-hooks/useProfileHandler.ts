import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

export const useProfileHandler = () => {
  const { 
    user, 
    studentProfile, 
    lecturerProfile, 
    clearUser, 
    clearToken, 
    clearMacAddress, 
    clearStudentProfile, 
    clearLecturerProfile 
  } = useAuthStore();
  const { isStudent } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Clear AsyncStorage
      await AsyncStorage.clear();

      // Clear Zustand stores
      clearUser();
      clearToken();
      clearMacAddress();
      clearStudentProfile();
      clearLecturerProfile();

      return true; // Indicate successful logout
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
      return false; // Indicate failed logout
    } finally {
      setIsLoading(false);
    }
  }, [clearUser, clearToken, clearMacAddress, clearStudentProfile, clearLecturerProfile]);

  return {
    user,
    studentProfile,
    lecturerProfile,
    isStudent,
    isLoading,
    handleLogout,
  };
}; 