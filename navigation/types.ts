// src/navigation/types.ts
import { UserType } from '../types';

export const SCREEN_NAMES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  CREATE_PROFILE: 'CreateProfile',
  MAIN_TABS: 'MainTabs',
  ZEROCONF_TEST: 'ZeroconfTest',
  ATTENDANCE: 'Attendance',
  USER_TYPE: 'UserType'
} as const;

export type RootStackParamList = {
  [SCREEN_NAMES.LOGIN]: { userType: UserType };
  [SCREEN_NAMES.REGISTER]: { userType: UserType };
  [SCREEN_NAMES.CREATE_PROFILE]: undefined;
  [SCREEN_NAMES.ATTENDANCE]: undefined;
  [SCREEN_NAMES.USER_TYPE]: undefined;
};