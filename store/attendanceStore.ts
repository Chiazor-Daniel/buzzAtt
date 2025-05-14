import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student } from '../screens/lec';

interface AttendanceStore {
  attendanceHistory: {
    [key: string]: Student[];
  };
  addAttendance: (date: string, students: Student[]) => void;
  getAttendance: (date: string) => Student[];
  getAllAttendance: () => {
    [key: string]: Student[];
  };
  clearAttendance: () => void;
}

export const useAttendanceStore = create<AttendanceStore>()(
  persist(
    (set) => ({
      attendanceHistory: {},
      addAttendance: (date, students) => 
        set((state) => ({
          attendanceHistory: {
            ...state.attendanceHistory,
            [date]: students
          }
        })),
      getAttendance: (date) => 
        (state) => state.attendanceHistory[date] || [],
      getAllAttendance: () => 
        (state: any) => state.attendanceHistory,
      clearAttendance: () => 
        set({ attendanceHistory: {} })
    }),
    {
      name: 'attendance-storage',
      storage: AsyncStorage
    }
  )
);