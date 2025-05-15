import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { createProfile } from '../apis'; // API function to create profile

export type ProfileType = 'student' | 'lecturer';

export interface ProfileFormData {
  profileType: ProfileType;
  matricNumber: string;
  staffId: string;
  facultyId: string;
  departmentId: string;
  phoneNumber: string;
  dateOfBirth: string; // Consider using a date picker and storing as Date or ISO string
}

interface UseCreateProfileHandlerProps {
  initialProfileType?: ProfileType;
  onCreateProfileSuccess: () => void;
}

export const useCreateProfileHandler = ({
  initialProfileType = 'student',
  onCreateProfileSuccess,
}: UseCreateProfileHandlerProps) => {
  const [formData, setFormData] = useState<ProfileFormData>(() => ({
    profileType: initialProfileType,
    matricNumber: '',
    staffId: '',
    facultyId: '',
    departmentId: '',
    phoneNumber: '',
    dateOfBirth: '',
  }));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error on input change
  }, []);

  const handleProfileTypeChange = useCallback((type: ProfileType) => {
    setFormData(prev => ({ 
      ...prev, 
      profileType: type,
      // Optional: Clear matricNumber/staffId when type changes
      // matricNumber: type === 'lecturer' ? '' : prev.matricNumber,
      // staffId: type === 'student' ? '' : prev.staffId,
    }));
    setError(null);
  }, []);

  const validateForm = () : boolean => {
    if (!formData.facultyId) {
      setError('Faculty is required.'); return false;
    }
    if (!formData.departmentId) {
      setError('Department is required.'); return false;
    }
    if (formData.profileType === 'student' && !formData.matricNumber) {
      setError('Matric Number is required for students.'); return false;
    }
    if (formData.profileType === 'lecturer' && !formData.staffId) {
      setError('Staff ID is required for lecturers.'); return false;
    }
    if (formData.phoneNumber) {
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError('Please enter a valid phone number (e.g., +2348012345678).'); return false;
      }
    }
    // Add DOB validation if necessary (e.g., format YYYY-MM-DD)
    return true;
  };

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!validateForm()) return;

    setIsLoading(true);
    let deviceId = '';
    try {
      deviceId = await DeviceInfo.getUniqueId();
    } catch (e) {
      console.error("Failed to get device ID", e);
      setError("Could not get device ID. Profile creation aborted.");
      setIsLoading(false);
      return;
    }

    try {
      const apiPayload = {
        student_profile: formData.profileType === 'student' ? {
          matric_number: formData.matricNumber,
          device_id: deviceId,
          faculty_id: formData.facultyId,
          department_id: formData.departmentId,
          phone_number: formData.phoneNumber || undefined, // Remains optional
          date_of_birth: formData.dateOfBirth, // Pass as string (can be empty if form field is empty)
        } : undefined,
        lecturer_profile: formData.profileType === 'lecturer' ? {
          staff_id: formData.staffId,
          faculty_id: formData.facultyId,
          department_id: formData.departmentId,
          phone_number: formData.phoneNumber || undefined, // Remains optional
          date_of_birth: formData.dateOfBirth, // Pass as string
        } : undefined,
      };

      await createProfile(formData.profileType, apiPayload);
      onCreateProfileSuccess(); // Component will handle success alert & navigation

    } catch (err: any) {
      console.error('Create profile error in hook:', err);
      let errorMessage = 'Failed to create profile. Please try again.';
      if (err.response?.data?.detail) {
        const errors = err.response.data.detail;
        if (Array.isArray(errors)) {
          errorMessage = errors.map((fieldError: any) => {
            // Customize error messages based on fieldError.loc or fieldError.msg
            if (fieldError.loc?.includes('faculty_id') || fieldError.loc?.includes('department_id')) {
              return 'Invalid faculty or department.'; // Simplified for now
            }
            return fieldError.msg || 'An error occurred.';
          }).join('\n');
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, onCreateProfileSuccess, validateForm]);

  return {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleProfileTypeChange,
    handleSubmit,
    clearError: () => setError(null),
  };
}; 