// src/navigation/types.ts
import { UserType } from '../types';

export type RootStackParamList = {
  Login: { userType: UserType };
  Register: { userType: UserType };
  Attendance: undefined;
  UserType: undefined;
};