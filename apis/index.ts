import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for all API requests
const baseURL = 'https://api.attendance.finnetexh.tech/api/v1';

// Axios instance with base URL and default headers
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication (if needed)
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      console.log("Token found")
      config.headers.Authorization = `Bearer ${token}`;
    } else{
      console.log("no token")
    }
    return config;
  });
// Auth Endpoints
export const loginUser = async (credentials: { username: string; password: string; device_id?: string }) => {
    const data = {
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password,
      scope: '',
      client_id: 'string',
      client_secret: 'string',
    };
  
    const response = await api.post('/auth/login/', data, {
      params: { device_id: credentials.device_id || '' }, // Only device_id in query params
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // JSON request body
    });

    console.log(response.data)
  
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
export const createProfile = async (profileType: 'admin' | 'lecturer' | 'student', profileData: any) => {
  const response = await api.post(`/student/profile/`, profileData);
  return response.data;
};

export const getProfile = async (profileType: 'student') => {
  const response = await api.get(`/student/profile/`);
  console.log(response)
  return response.data;
};

// Student Course Endpoints
export const getStudentClassroom = async () => {
  const response = await api.get('/student/course/');
  return response.data;
};

export const enrollInClass = async (availableClassId: string) => {
  const response = await api.post('/student/course/', { available_class_id: availableClassId });
  return response.data;
};

export const getAvailableClasses = async () => {
  const response = await api.get('/student/course/available-classes');
  return response.data;
};

export const getStudentSchedule = async (classroomId: string) => {
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
export const markAttendance = async (attendanceData: {
  classroom_id: string;
  student_id: string;
  is_present: boolean;
  percentage_attendance: number;
}) => {
  const response = await api.post('/lecturer/attendance/', attendanceData);
  return response.data;
};

export const getAttendance = async (classroomId: string) => {
  const response = await api.get('/lecturer/attendance/', { params: { classroom_id: classroomId } });
  return response.data;
};

export const markBulkAttendance = async (attendanceData: Array<{
  classroom_id: string;
  student_id: string;
  is_present: boolean;
  percentage_attendance: number;
}>) => {
  const response = await api.post('/lecturer/attendance/bulk', attendanceData);
  return response.data;
};

export const getAttendanceByStudent = async (studentId: string) => {
  const response = await api.get('/lecturer/attendance/student', { params: { student_id: studentId } });
  return response.data;
};

// Lecturer Schedule Endpoints
export const getLecturerSchedule = async (classroomId: string) => {
  const response = await api.get(`/lecturer/schedule/${classroomId}`);
  return response.data;
};

export const getLecturerSchedules = async (lecturerId: string) => {
  const response = await api.get(`/lecturer/schedule/${lecturerId}`);
  return response.data;
};

export const scheduleClass = async (classData: {
  classroom_id: string;
  lecturer_id: string;
  start_time: string;
  end_time: string;
  description: string;
}) => {
  const response = await api.post('/lecturer/schedule/', classData);
  return response.data;
};



export const getStudentCourses = async () => {
  const response = await fetch('/api/v1/student/course/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const enrollInCourse = async (availableClassId: any) => {
  const response = await fetch(`/api/v1/student/course/?available_class_id=${availableClassId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};


export const getSchedules = async (classroomId: string) => {
  const response = await fetch(`/api/v1/student/schedule/${classroomId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export default api;