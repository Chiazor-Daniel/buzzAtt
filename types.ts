// types.ts
export type StudentRecord = {
    id: string;
    ip: string;
    timestamp: string;
  };
  
  export type Session = {
    id: string;
    socket: any;
    port: number;
    broadcastInterval?: NodeJS.Timeout;
  };
  
  export type HeaderProps = {
    title: string;
    subtitle?: string;
  };

export interface User {
  id: string;
  email: string;
  profileType: 'student' | 'lecturer';
  name: string;
}

export interface StudentProfile {
  matricNumber: string | null;
  deviceId: string;
  facultyId: string | null;
  departmentId: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
}

export interface LecturerProfile {
  facultyId: string;
  phoneNumber: string | null;
  departmentId: string | null;
  staffId: string | null;
  dateOfBirth: string | null;
  id: string;
  userId: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isStudent: boolean;
  isOffline: boolean;
  studentProfile: StudentProfile | null;
  lecturerProfile: LecturerProfile | null;
  macAddress: string | null;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface NetworkState {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
}

export interface AppConfig {
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
}