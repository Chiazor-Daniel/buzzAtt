import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { SCREEN_NAMES } from '../navigation/config';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  [SCREEN_NAMES.LOGIN]: undefined;
  [SCREEN_NAMES.MAIN_TABS]: undefined;
};

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, typeof SCREEN_NAMES.MAIN_TABS>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, studentProfile, lecturerProfile, clearUser, clearToken, clearMacAddress, clearStudentProfile, clearLecturerProfile } = useAuthStore();
  const { isStudent } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
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

      // Navigate to the login screen
      navigation.reset({
        index: 0,
        routes: [{ name: SCREEN_NAMES.LOGIN }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
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
          refreshing={false}
          onRefresh={() => {}} // No need to refresh since we're using cached data
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
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name || 'N/A'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'N/A'}</Text>

        {isStudent && studentProfile && (
          <>
            <Text style={styles.label}>Matric Number</Text>
            <Text style={styles.value}>{studentProfile.matricNumber || 'N/A'}</Text>

            <Text style={styles.label}>Device ID</Text>
            <Text style={styles.value}>{studentProfile.deviceId || 'N/A'}</Text>

            <Text style={styles.label}>Faculty ID</Text>
            <Text style={styles.value}>{studentProfile.facultyId || 'N/A'}</Text>

            <Text style={styles.label}>Department ID</Text>
            <Text style={styles.value}>{studentProfile.departmentId || 'N/A'}</Text>
          </>
        )}

        {!isStudent && lecturerProfile && (
          <>
            <Text style={styles.label}>Faculty ID</Text>
            <Text style={styles.value}>{lecturerProfile.facultyId || 'N/A'}</Text>

            <Text style={styles.label}>Department ID</Text>
            <Text style={styles.value}>{lecturerProfile.departmentId || 'N/A'}</Text>

            <Text style={styles.label}>Staff ID</Text>
            <Text style={styles.value}>{lecturerProfile.staffId || 'N/A'}</Text>
          </>
        )}

        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>
          {isStudent ? studentProfile?.phoneNumber : lecturerProfile?.phoneNumber || 'N/A'}
        </Text>

        <Text style={styles.label}>Date of Birth</Text>
        <Text style={styles.value}>
          {isStudent ? studentProfile?.dateOfBirth : lecturerProfile?.dateOfBirth || 'N/A'}
        </Text>
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
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.darker,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  label: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.regular,
  },
  value: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.md,
    fontFamily: FONTS.medium,
  },
  logoutButton: {
    backgroundColor: THEME.error,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
});

export default ProfileScreen;