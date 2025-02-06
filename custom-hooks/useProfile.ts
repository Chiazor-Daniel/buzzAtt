import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { getProfile } from '../apis'; // Adjust path as needed
import { useAuthStore } from '../store'; // Adjust path as needed

export async function checkAuth() {
  console.log('Starting authentication check...');
  // Get the store functions using Zustand's getState()
  const { setToken, setUser, setStudentProfile, setIsStudent } = useAuthStore.getState();

  try {
    // Get and save the MAC address
    const macAddress = await DeviceInfo.getMacAddress();
    console.log('MAC Address retrieved:', macAddress);
    await AsyncStorage.setItem('macAddress', macAddress);
    console.log('MAC Address saved to AsyncStorage');

    // Retrieve saved data
    const savedToken = await AsyncStorage.getItem('access_token');
    const savedUser = await AsyncStorage.getItem('user');
    const savedStudentProfile = await AsyncStorage.getItem('studentProfile');

    console.log('Saved token:', savedToken);
    console.log('Saved user:', savedUser);
    console.log('Saved student profile:', savedStudentProfile);

    if (savedToken && savedUser) {
      const user = JSON.parse(savedUser);
      console.log('Parsed user:', user);
      setToken(savedToken);
      setUser(user);
      setIsStudent(user.profileType === 'student');
      console.log('Token and user set in store');

      // Handle student profile if the user is a student
      if (user.profileType === 'student') {
        if (savedStudentProfile) {
          const parsedProfile = JSON.parse(savedStudentProfile);
          setStudentProfile(parsedProfile);
          console.log('Student profile set from AsyncStorage:', parsedProfile);
        } else {
          console.log('No saved student profile found. Fetching from API...');
          const profile = await getProfile('student');
          console.log('Profile from API:', profile);
          if (profile) {
            const formattedProfile = {
              matricNumber: profile.matric_number,
              deviceId: profile.device_id,
              facultyId: profile.faculty_id,
              departmentId: profile.department_id,
              phoneNumber: profile.phone_number,
              dateOfBirth: profile.date_of_birth,
            };
            setStudentProfile(formattedProfile);
            await AsyncStorage.setItem('studentProfile', JSON.stringify(formattedProfile));
            console.log('Student profile fetched from API and saved:', formattedProfile);
          }
        }
      }
    } else {
      console.log('No token or user found in AsyncStorage.');
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  } finally {
    console.log('Authentication check complete.');
  }
}
