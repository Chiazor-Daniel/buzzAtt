import React from 'react';
import { THEME } from '../theme';
import { TabIcon } from '../components/TabIcon';
import DashboardScreen from '../screens/dasboard';
import { StudentScreen } from '../screens/stud';
import { LecturerScreen } from '../screens/lec';
import ProfileScreen from '../screens/profile';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

export const SCREEN_NAMES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  MAIN_TABS: 'MainTabs',
  DASHBOARD: 'Dashboard',
  PROFILE: 'Profile',
} as const;

export const tabNavigatorConfig = {
  screenOptions: {
    tabBarStyle: {
      backgroundColor: THEME.dark,
      borderTopWidth: 0,
    },
    tabBarActiveTintColor: THEME.accent,
    tabBarInactiveTintColor: THEME.textSecondary,
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600' as const,
    },
    headerStyle: {
      backgroundColor: THEME.dark,
    },
    headerTintColor: THEME.text,
    headerTitleStyle: {
      fontWeight: '600' as const,
    },
    headerShadowVisible: false,
  } as BottomTabNavigationOptions,
};

interface TabScreen {
  name: string;
  component: React.ComponentType<any>;
  options: {
    tabBarIcon: ({ color }: { color: string }) => JSX.Element;
    title?: string;
  };
}

export const getTabScreens = (isStudent: boolean, showDashboard: boolean): TabScreen[] => [
  {
    name: SCREEN_NAMES.DASHBOARD,
    component: showDashboard ? DashboardScreen : (isStudent ? StudentScreen : LecturerScreen),
    options: {
      tabBarIcon: ({ color }) => (
        <TabIcon name="view-dashboard" color={color} />
      ),
      title: `${isStudent ? 'Student' : 'Lecturer'} Dashboard`,
    },
  },
  {
    name: SCREEN_NAMES.PROFILE,
    component: ProfileScreen,
    options: {
      tabBarIcon: ({ color }) => (
        <TabIcon name="account" color={color} />
      ),
    },
  },
]; 