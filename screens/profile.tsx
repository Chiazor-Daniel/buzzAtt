import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { SCREEN_NAMES } from '../navigation/config';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfileHandler } from '../custom-hooks/useProfileHandler';

type RootStackParamList = {
  [SCREEN_NAMES.LOGIN]: undefined;
  [SCREEN_NAMES.MAIN_TABS]: undefined;
};

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, typeof SCREEN_NAMES.MAIN_TABS>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const {
    user,
    studentProfile,
    lecturerProfile,
    isStudent,
    isLoading,
    handleLogout,
  } = useProfileHandler();

  const onLogout = async () => {
    const success = await handleLogout();
    if (success) {
      navigation.reset({
        index: 0,
        routes: [{ name: SCREEN_NAMES.LOGIN }],
      });
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
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
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

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: THEME.background,
    fontWeight: 'bold',
  },
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
    fontFamily: FONTS.medium,
  },
});

export default ProfileScreen;