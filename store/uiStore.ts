import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UIState {
  isStudent: boolean;
  isOffline: boolean;
  showDashboard: boolean;
}

interface UIStore extends UIState {
  setIsStudent: (isStudent: boolean) => void;
  setIsOffline: (isOffline: boolean) => void;
  setShowDashboard: (showDashboard: boolean) => void;
  resetUI: () => void;
}

const initialState: UIState = {
  isStudent: true,
  isOffline: false,
  showDashboard: true,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,
      setIsStudent: async (isStudent) => {
        try {
          await AsyncStorage.setItem('isStudent', isStudent.toString());
          set({ isStudent });
        } catch (error) {
          console.error('Error saving isStudent:', error);
        }
      },
      setIsOffline: (isOffline) => set({ isOffline }),
      setShowDashboard: (showDashboard) => set({ showDashboard }),
      resetUI: () => {
        set(initialState);
        AsyncStorage.removeItem('isStudent');
      },
    }),
    {
      name: 'ui-storage',
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