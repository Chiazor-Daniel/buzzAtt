import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, StatusBar, StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { THEME, SPACING } from './theme';
import { initializeApp } from './services/initialization';
import { tabNavigatorConfig, getTabScreens, SCREEN_NAMES } from './navigation/config';
import { TabIcon } from './components/TabIcon';
import { LecturerScreen } from './screens/lec';
import { StudentScreen } from './screens/stud';
import ProfileScreen from './screens/profile';
import LoginScreen from './screens/login';
import RegisterScreen from './screens/register';
import DashboardScreen from './screens/dasboard';
import ZeroconfTest from './screens/ZeroconfTest';
import CreateProfileScreen from './screens/createProfile';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

function MainTabs() {
  const { isStudent, setIsStudent, isOffline, showDashboard, setShowDashboard } = useUIStore();

  const toggleScreen = () => {
    if (isOffline) {
      return;
    }
    setShowDashboard(!showDashboard);
  };

  const toggleMode = () => {
    setIsStudent(!isStudent);
    setShowDashboard(true);
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator {...tabNavigatorConfig}>
        {getTabScreens(isStudent, showDashboard).map((screen) => (
          <Tab.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
            options={screen.options}
          />
        ))}
      </Tab.Navigator>

      {/* <TouchableOpacity
        style={styles.floatingButtonTopRight}
        onPress={toggleMode}
      >
        <TabIcon
          name={isStudent ? 'account-school' : 'teach'}
          color={THEME.text}
        />
      </TouchableOpacity> */}

      {!isOffline && (
        <TouchableOpacity
          style={styles.floatingButtonBottom}
          onPress={toggleScreen}
        >
          <TabIcon
            name={showDashboard ? 'wifi-off' : 'view-dashboard'}
            color={THEME.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const App = () => {
  const { initializeStore, token } = useAuthStore();
  const { setIsOffline } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
      if (!state.isConnected && isNavigationReady) {
        Alert.alert(
          "Offline Mode",
          "You are offline. Switching to offline mode.",
          [{ text: "OK" }]
        );
      }
    });

    return () => unsubscribe();
  }, [isNavigationReady]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const initialState = await initializeApp();
        initializeStore(initialState);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      } 
    };

    initialize();
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <NavigationContainer
          onReady={() => setIsNavigationReady(true)}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName={token ? SCREEN_NAMES.MAIN_TABS : SCREEN_NAMES.LOGIN}
          >
            <Stack.Screen name={SCREEN_NAMES.LOGIN} component={LoginScreen} />
            <Stack.Screen name={SCREEN_NAMES.REGISTER} component={RegisterScreen} />
            <Stack.Screen name={SCREEN_NAMES.CREATE_PROFILE} component={CreateProfileScreen} />
            <Stack.Screen name={SCREEN_NAMES.MAIN_TABS} component={MainTabs} />
            <Stack.Screen name="ZeroconfTest" component={ZeroconfTest} />
            <Stack.Screen 
              name="StudentScreen" 
              component={StudentScreen} 
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: THEME.dark,
                },
                headerTintColor: THEME.text,
                headerTitleStyle: {
                  fontWeight: '600',
                },
                title: 'Class Attendance'
              }}
            />
            <Stack.Screen 
              name="LecturerScreen" 
              component={LecturerScreen} 
              options={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: THEME.dark,
                },
                headerTintColor: THEME.text,
                headerTitleStyle: {
                  fontWeight: '600',
                },
                title: 'Class Attendance'
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.dark,
  },
  floatingButtonTopRight: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingButtonBottom: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default App;