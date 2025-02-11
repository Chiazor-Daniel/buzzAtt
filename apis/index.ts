import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for all API requests
export const baseURL = 'https://api.attendance.finnetexh.tech/api/v1';

// Axios instance with base URL and default headers
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication and debugging
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    console.log('Token found:', token);
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('No token found');
  }

  // Log the request method, URL, and data (if any)
  console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
  if (config.data) {
    console.log('Request Data:', config.data);
  }

  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    // Log the response data
    console.log(`Response from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    // Log the error
    console.error(`Error in ${error.config.method.toUpperCase()} request to ${error.config.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
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

  console.log('Login Response:', response.data);
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
export const createProfile = async (profileType, profileData) => {
  const response = await api.post(`/student/profile/`, profileData);
  return response.data;
};

export const getProfile = async (profileType) => {
  const response = await api.get(`/student/profile/`);
  console.log('Profile Response:', response.data);
  return response.data;
};

// Student Course Endpoints
export const getStudentClassroom = async () => {
  const response = await api.get('/student/course/');
  return response.data;
};

export const enrollInClass = async (availableClassId) => {
  const response = await api.post('/student/course/', { available_class_id: availableClassId });
  return response.data;
};

export const getAvailableClasses = async () => {
  const response = await api.get('/student/course/available-classes');
  return response.data;
};

export const getStudentSchedule = async (classroomId) => {
  const response = await api.get(`/student/schedule/${classroomId}`);
  return response.data;
};

// Lecturer Course Endpoints
export const getStudents = async (classroomId) => {
  const response = await api.get('/lecturer/course/students', { params: { classroom_id: classroomId } });
  return response.data;
};

export const getLecturers = async (classroomId) => {
  const response = await api.get('/lecturer/course/lecturers', { params: { classroom_id: classroomId } });
  return response.data;
};

export const getCourses = async (lecturerId) => {
  const response = await api.get('/lecturer/course/courses', { params: { lecturer_id: lecturerId } });
  return response.data;
};

// Lecturer Attendance Endpoints
export const markAttendance = async (attendanceData) => {
  const response = await api.post('/lecturer/attendance/', attendanceData);
  return response.data;
};

export const getAttendance = async (classroomId) => {
  const response = await api.get('/lecturer/attendance/', { params: { classroom_id: classroomId } });
  return response.data;
};

export const markBulkAttendance = async (attendanceData) => {
  const response = await api.post('/lecturer/attendance/bulk', attendanceData);
  return response.data;
};

export const getAttendanceByStudent = async (studentId) => {
  const response = await api.get('/lecturer/attendance/student', { params: { student_id: studentId } });
  return response.data;
};

// Lecturer Schedule Endpoints
export const getLecturerSchedule = async (classroomId) => {
  const response = await api.get(`/lecturer/schedule/${classroomId}`);
  return response.data;
};

export const getLecturerSchedules = async (lecturerId) => {
  const response = await api.get(`/lecturer/schedule/${lecturerId}`);
  return response.data;
};

export const scheduleClass = async (classData) => {
  const response = await api.post('/lecturer/schedule/', classData);
  return response.data;
};

// Additional Endpoints
export const getStudentCourses = async () => {
  const response = await api.get('/api/v1/student/course/');
  return response.data;
};

export const enrollInCourse = async (availableClassId) => {
  const response = await api.post(`/api/v1/student/course/?available_class_id=${availableClassId}`);
  return response.data;
};

export const getSchedules = async (classroomId) => {
  const response = await api.get(`/api/v1/student/schedule/${classroomId}`);
  return response.data;
};

export default api;