import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { registerUser } from '../apis'; // Assuming registerUser API function

interface UseRegistrationHandlerProps {
  onRegistrationSuccess: () => void;
}

export const useRegistrationHandler = ({ onRegistrationSuccess }: UseRegistrationHandlerProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = useCallback(async () => {
    setError(null); // Clear previous errors
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email,
        password,
        first_name: firstName || undefined, // Send undefined if empty, API might handle it
        last_name: lastName || undefined,  // Send undefined if empty
      });
      
      // Alert for success is handled by the component via onRegistrationSuccess callback
      onRegistrationSuccess();

    } catch (err: any) {
      console.error('Registration error in hook:', err);
      let errorMessage = 'Registration failed. Please try again.';
        
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.join('\n');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, firstName, lastName, onRegistrationSuccess]);

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleRegister,
    clearError: () => setError(null), // Optional: allow component to clear error
  };
}; 