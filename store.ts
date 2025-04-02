import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, StudentProfile, LecturerProfile } from './types';

interface AuthStore extends AuthState {
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setIsStudent: (isStudent: boolean) => void;
  setIsOffline: (isOffline: boolean) => void;
  setStudentProfile: (profile: StudentProfile) => void;
  setLecturerProfile: (profile: LecturerProfile) => void;
  setMacAddress: (macAddress: string) => void;
  initializeStore: (state: Partial<AuthState>) => void;
  logout: () => void;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isStudent: true,
  isOffline: false,
  studentProfile: null,
  lecturerProfile: null,
  macAddress: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setIsStudent: async (isStudent) => {
        try {
          await AsyncStorage.setItem('isStudent', isStudent.toString());
          set({ isStudent });
        } catch (error) {
          console.error('Error saving isStudent:', error);
        }
      },
      setIsOffline: (isOffline) => set({ isOffline }),
      setStudentProfile: (profile) => set({ studentProfile: profile }),
      setLecturerProfile: (profile) => set({ lecturerProfile: profile }),
      setMacAddress: (macAddress) => set({ macAddress }),
      initializeStore: (state) => set((prev) => ({ ...prev, ...state })),
      logout: () => {
        set(initialState);
        AsyncStorage.multiRemove([
          'access_token',
          'user',
          'studentProfile',
          'lecturerProfile',
          'isStudent',
        ]);
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);