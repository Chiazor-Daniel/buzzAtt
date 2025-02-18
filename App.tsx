import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, StatusBar, StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from './store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

import { LecturerScreen } from './screens/lec';
import { StudentScreen } from './screens/stud';
import HistoryScreen from './screens/history';
import ProfileScreen from './screens/profile';
import LoginScreen from './screens/login';
import RegisterScreen from './screens/register';
import { getProfile } from './apis';
import { DashboardScreen } from './screens/dasboard';
import { StudentCourseScreen } from './screens/sydentCourses';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

const queryClient = new QueryClient();

function MainTabs() {
  const { isStudent, setIsStudent } = useAuthStore();
  const [showDashboard, setShowDashboard] = useState(true);

  const toggleScreen = () => {
    setShowDashboard((prev) => {
      const newState = !prev;
      if (!newState) {
        Alert.alert(
          "Offline Mode",
          "You've switched to offline mode.",
          [{ text: "OK", onPress: () => console.log("Alert dismissed") }]
        );
      }
      return newState;
    });
  };

  const toggleMode = () => {
    Alert.alert(
      "Switch Mode",
      `Switch to ${isStudent ? 'Lecturer' : 'Student'} mode?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Switch",
          onPress: () => {
            setIsStudent(!isStudent);
            AsyncStorage.setItem('isStudent', (!isStudent).toString());
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: THEME.dark,
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: THEME.accent,
          tabBarInactiveTintColor: THEME.textSecondary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: THEME.dark,
          },
          headerTintColor: THEME.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={showDashboard ? DashboardScreen : (isStudent ? StudentScreen : LecturerScreen)}
          options={{
            tabBarIcon: ({ color }) => <Icon name="view-dashboard" size={24} color={color} />,
            title: `${isStudent ? 'Student' : 'Lecturer'} Dashboard`,
          }}
        />
        {/* <Tab.Screen
          name="Courses"
          component={StudentCourseScreen}
          options={{
            tabBarIcon: ({ color }) => <Icon name="book" size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ color }) => <Icon name="history" size={24} color={color} />,
          }}
        /> */}
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color }) => <Icon name="account" size={24} color={color} />,
          }}
        />
      </Tab.Navigator>

      <TouchableOpacity
        style={styles.floatingButtonBottom}
        onPress={toggleScreen}
      >
        <Icon
          name={showDashboard ? (isStudent ? 'wifi-off' : 'wifi-off') : 'view-dashboard'}
          size={24}
          color={THEME.text}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.floatingButtonMiddle}
        onPress={toggleMode}
      >
        <Icon
          name={isStudent ? "person" : "user-ninja"}
          size={24}
          color={THEME.text}
        />
      </TouchableOpacity>
    </View>
  );
}

const App = () => {
  const { token, initializeStore } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get all cached values at once
        const [
          macAddress,
          savedToken,
          savedUser,
          savedStudentProfile,
          savedIsStudent
        ] = await Promise.all([
          DeviceInfo.getMacAddress(),
          AsyncStorage.getItem('access_token'),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('studentProfile'),
          AsyncStorage.getItem('isStudent')
        ]);

        // Save MAC address
        await AsyncStorage.setItem('macAddress', macAddress);

        if (savedToken && savedUser) {
          const user = JSON.parse(savedUser);
          const initialState: any = {
            token: savedToken,
            user,
            macAddress,
            isStudent: savedIsStudent !== null ? savedIsStudent === 'true' : user.profileType === 'student'
          };

          if (savedStudentProfile) {
            initialState.studentProfile = JSON.parse(savedStudentProfile);
          } else {
            try {
              const profile = await getProfile('student');
              if (profile) {
                const formattedProfile = {
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

          // Initialize store with all cached values at once
          initializeStore(initialState);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: THEME.dark,
              },
              headerTintColor: THEME.text,
              headerTitleStyle: {
                fontWeight: '600',
              },
              headerShadowVisible: false,
            }}
          >
            {!token ? (
              <>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Register"
                  component={RegisterScreen}
                  options={{ headerShown: false }}
                />
              </>
            ) : (
              <>
                <Stack.Screen
                  name="Main"
                  component={MainTabs}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Student"
                  component={StudentScreen}
                  options={{ title: 'Student Attendance' }}
                />
                <Stack.Screen
                  name="Lecturer"
                  component={LecturerScreen}
                  options={{ title: 'Attendance Monitor' }}
                />
                <Stack.Screen
                  name="StudentCourse"
                  component={StudentCourseScreen}
                  options={{ title: 'Course Management' }}
                />
              </>
            )}
          </Stack.Navigator>
        </SafeAreaView>
      </NavigationContainer>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.darker,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonBottom: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: THEME.accent,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonMiddle: {
    position: 'absolute',
    top: '50%',
    right: 20,
    backgroundColor: THEME.accent,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    transform: [{ translateY: -25 }],
  },
});

export default App;