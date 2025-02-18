// import { create } from 'zustand';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// type UserProfile = {
//   id: string;
//   name: string;
//   email: string;
//   profileType: 'student' | 'lecturer';
// };

// type StudentProfile = {
//   matricNumber: string | null;
//   deviceId: string | null;
//   facultyId: string | null;
//   departmentId: string | null;
//   phoneNumber: string | null;
//   dateOfBirth: string | null;
// };

// type AuthState = {
//   user: UserProfile | null;
//   token: string | null;
//   macAddress: string | null;
//   isStudent: boolean;
//   studentProfile: StudentProfile | null;

//   setUser: (user: UserProfile) => void;
//   setToken: (token: string) => void;
//   setMacAddress: (macAddress: string) => void;
//   setIsStudent: (isStudent: boolean) => void;

//   setStudentProfile: (profile: StudentProfile) => void;
//   clearStudentProfile: () => void;

//   clearUser: () => void;
//   clearToken: () => void;
//   clearMacAddress: () => void;

//   loadFromAsyncStorage: () => void;
// };

// export const useAuthStore = create<AuthState>((set) => ({
//   user: null,
//   token: null,
//   macAddress: null,
//   isStudent: true,
//   studentProfile: null,

//   setUser: (user) => set({ user }),
//   setToken: (token) => set({ token }),
//   setMacAddress: (macAddress) => set({ macAddress }),
//   setIsStudent: (isStudent) => set({ isStudent }),

//   setStudentProfile: (profile) => set({ studentProfile: profile }),
//   clearStudentProfile: () => set({ studentProfile: null }),

//   clearUser: () => set({ user: null }),
//   clearToken: () => set({ token: null }),
//   clearMacAddress: () => set({ macAddress: null }),

//   loadFromAsyncStorage: async () => {
//     const token = await AsyncStorage.getItem('access_token');
//     const user = await AsyncStorage.getItem('user');
//     const studentProfile = await AsyncStorage.getItem('studentProfile');
//     const macAddress = await AsyncStorage.getItem('macAddress');

//     if (token) set({ token });
//     if (user) set({ user: JSON.parse(user) });
//     if (studentProfile) set({ studentProfile: JSON.parse(studentProfile) });
//     if (macAddress) set({ macAddress });
//   },
// }));


import { create } from 'zustand';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  profileType: 'student' | 'lecturer';
};

type StudentProfile = {
  matricNumber: string | null;
  deviceId: string | null;
  facultyId: string | null;
  departmentId: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
};

type AuthState = {
  user: UserProfile | null;
  token: string | null;
  macAddress: string | null;
  isStudent: boolean;
  studentProfile: StudentProfile | null;

  setUser: (user: UserProfile) => void;
  setToken: (token: string) => void;
  setMacAddress: (macAddress: string) => void;
  setIsStudent: (isStudent: boolean) => void;

  setStudentProfile: (profile: StudentProfile) => void;
  clearStudentProfile: () => void;

  clearUser: () => void;
  clearToken: () => void;
  clearMacAddress: () => void;

  initializeStore: (initialState: Partial<AuthState>) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  macAddress: null,
  isStudent: true,
  studentProfile: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setMacAddress: (macAddress) => set({ macAddress }),
  setIsStudent: (isStudent) => set({ isStudent }),

  setStudentProfile: (profile) => set({ studentProfile: profile }),
  clearStudentProfile: () => set({ studentProfile: null }),

  clearUser: () => set({ user: null }),
  clearToken: () => set({ token: null }),
  clearMacAddress: () => set({ macAddress: null }),

  initializeStore: (initialState) => set(initialState),
}));