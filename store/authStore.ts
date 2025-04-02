import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, StudentProfile, LecturerProfile } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  studentProfile: StudentProfile | null;
  lecturerProfile: LecturerProfile | null;
  macAddress: string | null;
}

interface AuthStore extends AuthState {
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setStudentProfile: (profile: StudentProfile | null) => void;
  setLecturerProfile: (profile: LecturerProfile | null) => void;
  setMacAddress: (macAddress: string | null) => void;
  clearUser: () => void;
  clearToken: () => void;
  clearMacAddress: () => void;
  clearStudentProfile: () => void;
  clearLecturerProfile: () => void;
  initializeStore: (state: Partial<AuthState>) => void;
  logout: () => void;
}

const initialState: AuthState = {
  token: null,
  user: null,
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
      setStudentProfile: (profile) => set({ studentProfile: profile }),
      setLecturerProfile: (profile) => set({ lecturerProfile: profile }),
      setMacAddress: (macAddress) => set({ macAddress }),
      clearUser: () => set({ user: null }),
      clearToken: () => set({ token: null }),
      clearMacAddress: () => set({ macAddress: null }),
      clearStudentProfile: () => set({ studentProfile: null }),
      clearLecturerProfile: () => set({ lecturerProfile: null }),
      initializeStore: (state) => set((prev) => ({ ...prev, ...state })),
      logout: () => {
        set(initialState);
        AsyncStorage.multiRemove([
          'access_token',
          'user',
          'studentProfile',
          'lecturerProfile',
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