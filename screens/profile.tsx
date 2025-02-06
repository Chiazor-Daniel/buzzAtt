import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, createProfile } from '../apis'; // Replace with actual API imports
import { useAuthStore } from '../store'; // Import the Zustand store
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileNotFound, setIsProfileNotFound] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user, clearUser, clearToken, clearMacAddress, clearStudentProfile } = useAuthStore();

  const fetchProfile = async () => {
    setRefreshing(true); // Show the refreshing indicator
    try {
      const profileData = await getProfile(user?.profileType || 'student');
      setProfile(profileData);
      setIsProfileNotFound(false);
    } catch (error) {
      console.log(error);
      if (error.response?.status === 404) {
        setIsProfileNotFound(true);
      } else {
        Alert.alert('Error', 'Failed to fetch profile data');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false); // Hide the refreshing indicator
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.profileType]);

  const handleLogout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();

      // Clear Zustand store
      clearUser();
      clearToken();
      clearMacAddress();
      clearStudentProfile();

      // Navigate to the login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // Replace 'Login' with your actual login screen name
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchProfile} // Call the fetchProfile function on pull-to-refresh
          colors={[THEME.accent]}
        />
      }
    >
      <View style={styles.profilePictureContainer}>
      <Image
          source={{ uri: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%3Fid%3DOIP.7SUq3c2AW6pyW2V_yCyBgwHaHa%26pid%3DApi&f=1&ipt=13d080a3ffc033fd6d0e7a447e13b710cac47b76114cac02032a971540d20bd3&ipo=images' }}
          style={styles.profilePicture}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Matric Number</Text>
        <Text style={styles.value}>{profile?.matric_number || 'N/A'}</Text>

        <Text style={styles.label}>Device ID</Text>
        <Text style={styles.value}>{profile?.device_id || 'N/A'}</Text>

        <Text style={styles.label}>Faculty ID</Text>
        <Text style={styles.value}>{profile?.faculty_id || 'N/A'}</Text>

        <Text style={styles.label}>Department ID</Text>
        <Text style={styles.value}>{profile?.department_id || 'N/A'}</Text>

        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>{profile?.phone_number || 'N/A'}</Text>

        <Text style={styles.label}>Date of Birth</Text>
        <Text style={styles.value}>{profile?.date_of_birth || 'N/A'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.darker,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.darker,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: THEME.accent,
  },
  infoContainer: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: THEME.error,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
