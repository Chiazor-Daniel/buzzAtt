import { useState, useEffect, useCallback } from 'react';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import Toast from 'react-native-toast-message';

// This is a placeholder for the actual function that will be called on successful auth
// In a real scenario, this would likely be a function passed in or part of another service/hook
// type OnAuthSuccessCallback = () => void;

export const useAttendanceAuth = (onAuthSuccess: () => void) => {
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { available, biometryType, error: bioError } = await rnBiometrics.isSensorAvailable();
        
        if (bioError) {
            console.warn('Biometric sensor check error:', bioError);
            setBiometricAvailable(false);
            return;
        }

        setBiometricAvailable(available);
        if (available) {
          if (biometryType === BiometryTypes.FaceID) setBiometricType('Face ID');
          else if (biometryType === BiometryTypes.TouchID) setBiometricType('Fingerprint');
          else setBiometricType('Biometric');
        }
      } catch (e) {
        console.error('Failed to check biometrics:', e);
        setBiometricAvailable(false);
      }
    };
    checkBiometrics();
  }, []);

  const requestAuthentication = useCallback(async (matricNumberProvided: boolean) => {
    if (!matricNumberProvided) {
      Toast.show({ type: 'error', text1: 'Input Required', text2: 'Please enter your matric number first.' });
      return;
    }

    if (biometricAvailable) {
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { success, error: promptError } = await rnBiometrics.simplePrompt({
          promptMessage: `Authenticate with ${biometricType}`,
          cancelButtonText: 'Use PIN Instead',
        });

        if (promptError) {
            console.warn('Biometric prompt error:', promptError);
             // If user cancels or there's a non-critical error, often falls through to 'success: false'
            // but specific errors might mean PIN fallback is better.
            if (promptError === 'UserCancel' || promptError === 'UserFallback') {
                setShowPinModal(true); // Explicitly show PIN modal on cancel/fallback
                return;
            }
            // For other errors, it might be better to show a toast and not proceed or show PIN
            // Toast.show({ type: 'error', text1: 'Biometric Error', text2: 'Could not use biometrics.' });
            // For now, falling back to PIN for most prompt errors for simplicity
            setShowPinModal(true);
            return;
        }
        
        if (success) {
          onAuthSuccess();
        } else {
          // This case handles biometric failure (not matching) or if cancel didn't set promptError
          setShowPinModal(true);
        }
      } catch (e) { // Catching structural error from simplePrompt if any
        console.error('Biometric authentication system error:', e);
        Toast.show({ type: 'error', text1: 'Authentication Error', text2: 'Biometric system unavailable. Try PIN.' });
        setShowPinModal(true); // Fallback to PIN on system error
      }
    } else {
      // No biometrics available, directly show PIN modal
      setShowPinModal(true);
    }
  }, [biometricAvailable, biometricType, onAuthSuccess]);

  const verifyPin = useCallback(() => {
    // In a real app, PIN would be stored securely or verified against a server/stored hash
    if (pin === '1234') { // Default/Demo PIN
      setShowPinModal(false);
      setPin('');
      setPinError('');
      onAuthSuccess();
    } else {
      setPinError('Incorrect PIN. Please try again.');
      setPin(''); // Clear PIN input on error
    }
  }, [pin, onAuthSuccess]);

  const closePinModal = useCallback(() => {
    setShowPinModal(false);
    setPin('');
    setPinError('');
  }, []);

  return {
    biometricAvailable,
    biometricType,
    showPinModal,
    pin,
    pinError,
    setPin, // Expose setPin for the PinInputModal
    requestAuthentication,
    verifyPin,
    closePinModal, // Expose closePinModal
  };
}; 