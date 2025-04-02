import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { getProfile } from '../apis';
import { AuthState, StudentProfile, LecturerProfile } from '../types';

export const initializeApp = async (): Promise<Partial<AuthState>> => {
  try {
    const [
      macAddress,
      savedToken,
      savedUser,
      savedStudentProfile,
      savedLecturerProfile,
      savedIsStudent
    ] = await Promise.all([
      DeviceInfo.getMacAddress(),
      AsyncStorage.getItem('access_token'),
      AsyncStorage.getItem('user'),
      AsyncStorage.getItem('studentProfile'),
      AsyncStorage.getItem('lecturerProfile'),
      AsyncStorage.getItem('isStudent')
    ]);

    await AsyncStorage.setItem('macAddress', macAddress);

    if (!savedToken || !savedUser) {
      return { macAddress };
    }

    const user = JSON.parse(savedUser);
    const initialState: Partial<AuthState> = {
      token: savedToken,
      user,
      macAddress,
      isStudent: savedIsStudent !== null ? savedIsStudent === 'true' : user.profileType === 'student'
    };

    if (user.profileType === 'student') {
      if (savedStudentProfile) {
        initialState.studentProfile = JSON.parse(savedStudentProfile);
      } else {
        try {
          const profile = await getProfile('student');
          if (profile) {
            const formattedProfile: StudentProfile = {
              matricNumber: profile.matric_number,
              deviceId: profile.device_id,
              facultyId: profile.faculty_id,
              departmentId: profile.department_id,
              phoneNumber: profile.phone_number,
              dateOfBirth: profile.date_of_birth,
            };
            initialState.studentProfile = formattedProfile;
            await AsyncStorage.setItem('studentProfile', JSON.stringify(formattedProfile));
          }
        } catch (error) {
          console.error('Error fetching student profile:', error);
        }
      }
    }

    if (user.profileType === 'lecturer') {
      if (savedLecturerProfile) {
        initialState.lecturerProfile = JSON.parse(savedLecturerProfile);
      } else {
        try {
          const profile = await getProfile('lecturer');
          if (profile) {
            const formattedProfile: LecturerProfile = {
              facultyId: profile.faculty_id,
              phoneNumber: profile.phone_number,
              departmentId: profile.department_id,
              staffId: profile.staff_id,
              dateOfBirth: profile.date_of_birth,
              id: profile.id,
              userId: profile.user_id
            };
            initialState.lecturerProfile = formattedProfile;
            await AsyncStorage.setItem('lecturerProfile', JSON.stringify(formattedProfile));
          }
        } catch (error) {
          console.error('Error fetching lecturer profile:', error);
        }
      }
    }

    return initialState;
  } catch (error) {
    console.error('Error during app initialization:', error);
    return {};
  }
}; 