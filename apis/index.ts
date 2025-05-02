import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentConfig } from '../src/config/apiConfig';

// Base URL for all API requests
export const baseURL = currentConfig.baseURL;

// Axios instance with base URL and default headers
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true,
  // Allow self-signed certificates and HTTPS issues
  https: {
    rejectUnauthorized: false
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      throw new Error('Network connection error. Please check your internet connection.');
    }
    
    // Handle unauthorized access
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('access_token');
      throw new Error('Session expired. Please log in again.');
    }
    
    // Handle other errors
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    
    throw error;
  }
);

// Auth Endpoints
export const loginUser = async (credentials) => {
  const data = {
    grant_type: 'password',
    username: credentials.username,
    password: credentials.password,
    scope: '',
    client_id: 'string',
    client_secret: 'string',
  };

  const response = await api.post('/auth/login/', data, {
    params: { device_id: credentials.device_id || '' },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data;
};

interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export const registerUser = async (userData: RegisterData) => {
  const response = await api.post('/auth/register/', {}, {
    params: {
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name
    }
  });
  return response.data;
};

export const testToken = async () => {
  const response = await api.post('/auth/login/test-token');
  return response.data;
};

// Utils Endpoints
export const healthCheck = async () => {
  const response = await api.get('/utils/health-check/');
  return response.data;
};

// Profile Endpoints
interface StudentProfile {
  matric_number: string;
  device_id: string;
  faculty_id: string;
  department_id: string;
  phone_number?: string;
  date_of_birth: string;
}

interface LecturerProfile {
  staff_id: string;
  faculty_id: string;
  department_id: string;
  phone_number?: string;
  date_of_birth: string;
}

interface ProfileData {
  student_profile?: StudentProfile;
  lecturer_profile?: LecturerProfile;
}

export const createProfile = async (profileType: 'student' | 'lecturer', profileData: ProfileData) => {
  const response = await api.post(`/${profileType}/profile/`, profileData);
  return response.data;
};

export const getProfile = async (profileType) => {
  let endpoint = '';
  if (profileType === 'student') {
    endpoint = '/student/profile/';
  } else if (profileType === 'lecturer') {
    endpoint = '/lecturer/profile/';
  } else {
    throw new Error('Invalid profile type');
  }

  const response = await api.get(endpoint);
  return response.data;
};

// Student Course Endpoints
export const getStudentClassroom = async () => {
  const response = await api.get('/student/course/');
  return response.data;
};

export const enrollInClass = async (availableClassId) => {
  const response = await api.post('/student/course/', null, {
    params: { available_class_id: availableClassId }
  });
  return response.data;
};

export const getAvailableClasses = async () => {
  const response = await api.get('/student/course/available-classes');
  return response.data;
};

// Student Schedule Endpoints
export const getStudentSchedule = async (classroomId: string) => {
  const response = await api.get(`/student/course/schedule/${classroomId}`);
  return response.data;
};

export const getStudentSchedules = async (classroomId: string) => {
  const response = await api.get(`/student/schedule/${classroomId}`);
  return response.data;
};

// Lecturer Course Endpoints
export const getStudents = async (classroomId: string) => {
  const response = await api.get('/lecturer/course/students', { params: { classroom_id: classroomId } });
  return response.data;
};

export const getLecturers = async (classroomId: string) => {
  const response = await api.get('/lecturer/course/lecturers', { params: { classroom_id: classroomId } });
  return response.data;
};

export const getCourses = async (lecturerId: string) => {
  const response = await api.get('/lecturer/course/courses', { params: { lecturer_id: lecturerId } });
  return response.data;
};

// Lecturer Attendance Endpoints
export const markAttendance = async (attendanceData: any) => {
  const response = await api.post('/lecturer/attendance/', attendanceData);
  return response.data;
};

export const getAttendance = async (classroomId: string) => {
  const response = await api.get('/lecturer/attendance/', { params: { classroom_id: classroomId } });
  return response.data;
};

export const markBulkAttendance = async (attendanceData: any) => {
  const response = await api.post('/lecturer/attendance/bulk', attendanceData);
  return response.data;
};

export const getAttendanceByStudent = async (studentId: string) => {
  const response = await api.get('/lecturer/attendance/student', { params: { student_id: studentId } });
  return response.data;
};

// Lecturer Schedule Endpoints
export const createClassSchedule = async (scheduleData : any) => {
  const response = await api.post('/lecturer/schedule/', scheduleData);
  return response.data;
};

export const getLecturerSchedule = async (classroomId: string) => {
  const response = await api.get(`/lecturer/schedule/${classroomId}`);
  return response.data;
};

export const getLecturerSchedules = async (lecturerId: string) => {
  const response = await api.get(`/lecturer/schedule/${lecturerId}`);
  return response.data;
};

export const scheduleClass = async (classData: any) => {
  const response = await api.post('/lecturer/schedule/', classData);
  return response.data;
};

export const createSchedule = async (scheduleData: any) => {
  const response = await api.post('/lecturer/schedule/', scheduleData);
  return response.data;
};

// Lecturer Attendance Management Endpoints
export const removeAttendance = async (attendanceId: string) => {
  const response = await api.delete(`/lecturer/attendance/${attendanceId}`);
  return response.data;
};

export const updateAttendance = async (attendanceId: string, attendanceData: any) => {
  const response = await api.put(`/lecturer/attendance/${attendanceId}`, attendanceData);
  return response.data;
};


// Student Course Management Endpoints
export const enrollInCourse = async (classId: string ) => {
  const response = await api.post(`/student/course/`, {
    available_class_id: classId
  });
  return response.data;
};

export const removeAvailableClass = async (availableClassId: string) => {
  const response = await api.delete(`/student/course/available/${availableClassId}`);
  return response.data;
};

export const getEligibleStudents = async (classroomId: string) => {
  const response = await api.get(`/student/course/${classroom_id}/eligible-students`);
  return response.data;
};

// Course Management Endpoints
export const addAvailableClass = async (classroomId: string, studentId: string) => {
  const response = await api.post(`/course/available/${classroom_id}/student/${student_id}`);
  return response.data;
};

export const getAvailableClassesForStudent = async (studentId: string) => {
  const response = await api.get(`/course/available/${studentId}`);
  return response.data;
};

export const enrollInAvailableClass = async (availableClassId: string) => {
  const response = await api.post(`/course/enroll/${availableClassId}`);
  return response.data;
};

// Schedule Management Endpoints
export const updateSchedule = async (scheduleId: string, scheduleData: any) => {
  const response = await api.put(`/schedule/${scheduleId}`, scheduleData);
  return response.data;
};

export const deleteSchedule = async (scheduleId: string) => {
  const response = await api.delete(`/schedule/${scheduleId}`);
  return response.data;
};

export default api;