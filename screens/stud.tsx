import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Animated,
  Keyboard,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import UdpSocket from 'react-native-udp';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { Header } from '../components/utils';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

export function StudentScreen({ navigation, route }: { navigation: any, route: any }) {
  const { className } = route.params || {};
  const [matricNumber, setMatricNumber] = useState<string>('');
  const [isMarking, setIsMarking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [lastMarkedTime, setLastMarkedTime] = useState<string>('');
  const [lecturerIP, setLecturerIP] = useState<string | null>(null);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];
  

  // Add this useEffect:
useEffect(() => {
  const discoverySocket = new UdpSocket.Socket({ type: 'udp4' });
  
  discoverySocket.bind(3001, '0.0.0.0', () => {
    discoverySocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'lecturer_here') {
          setLecturerIP(rinfo.address); // Save lecturer's IP
        }
      } catch (e) {
        console.log("Discovery error:", e);
      }
    });
  });

  return () => discoverySocket.close();
}, []);

  // Check if biometrics are available
  useEffect(() => {
    const checkBiometrics = async () => {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      setBiometricAvailable(available);
      if (available && biometryType === BiometryTypes.Biometrics) {
        setBiometricType('Biometric');
      } else if (available && biometryType === BiometryTypes.FaceID) {
        setBiometricType('Face ID');
      } else if (available && biometryType === BiometryTypes.TouchID) {
        setBiometricType('Fingerprint');
      }
    };
    
    checkBiometrics();
  }, []);

  useEffect(() => {
    if (isSuccess) {
      // Animate success state - shorter and less intrusive
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.delay(800),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => setIsSuccess(false));
    }
  }, [isSuccess, fadeAnim]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const authenticateWithBiometrics = async () => {
    if (!matricNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your matric number'
      });
      return;
    }
    
    if (biometricAvailable) {
      try {
        const rnBiometrics = new ReactNativeBiometrics();
        const { success } = await rnBiometrics.simplePrompt({
          promptMessage: 'Authenticate to mark attendance',
          cancelButtonText: 'Use PIN instead'
        });
        
        if (success) {
          // Biometric authentication successful
          sendAttendanceData();
        } else {
          // User canceled or failed biometric auth, show PIN modal
          setShowPinModal(true);
        }
      } catch (error) {
        console.error('Biometric error:', error);
        // Fall back to PIN
        setShowPinModal(true);
      }
    } else {
      // No biometrics available, use PIN
      setShowPinModal(true);
    }
  };
  
  const verifyPin = () => {
    // Default PIN is 1234
    if (pin === '1234') {
      setShowPinModal(false);
      setPin('');
      setPinError('');
      sendAttendanceData();
    } else {
      setPinError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };
  
  const sendAttendanceData = () => {
    Keyboard.dismiss();
    animateButton();
    
    if (!matricNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your matric number'
      });
      return;
    }
  
    setIsMarking(true);
    const socket = new UdpSocket.Socket({ type: 'udp4' });
    
    socket.bind(0, '0.0.0.0', () => {
      const attendanceData = JSON.stringify({
        type: 'mark_attendance',
        matricNumber: matricNumber.trim(),
        timestamp: Date.now()
      });
  
      // 1. FIRST TRY: If we have lecturer's IP, use direct send
      if (lecturerIP) {
        console.log('Direct send to lecturer IP:', lecturerIP);
        socket.send(attendanceData, 0, attendanceData.length, 3000, lecturerIP, (err) => {
          if (err) {
            console.log('Direct send failed, falling back to broadcast');
            sendBroadcast(); // Fallback to broadcast
          } else {
            handleSuccess();
          }
        });
      } 
      // 2. FALLBACK: Original broadcast behavior
      else {
        sendBroadcast();
      }
  
      function sendBroadcast() {
        const addresses = ['255.255.255.255', '192.168.0.255', '192.168.1.255'];
        let attempts = 0;
  
        const trySend = () => {
          if (attempts >= addresses.length) {
            handleFailure();
            return;
          }
  
          const address = addresses[attempts];
          attempts++;
  
          socket.send(attendanceData, 0, attendanceData.length, 3000, address, (err) => {
            if (err) {
              console.error(`Error sending to ${address}:`, err);
              trySend(); // Try next address
            } else {
              handleSuccess();
            }
          });
        };
  
        trySend();
      }
  
      function handleSuccess() {
        setIsMarking(false);
        setIsSuccess(true);
        setLastMarkedTime(new Date().toLocaleTimeString());
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Attendance marked'
        });
        socket.close();
      }
  
      function handleFailure() {
        setIsMarking(false);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to mark attendance'
        });
        socket.close();
      }
    });
  };
  
  const markAttendance = () => {
    authenticateWithBiometrics();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header title={`Student Attendance - ${className || 'Class'}`} />
      
      <View style={styles.content}>
        {/* Success Animation - Green alert at bottom */}
        <Animated.View 
          style={[styles.successNotification, { opacity: fadeAnim }]}
          pointerEvents="none"
        >
          <View style={styles.successContent}>
            <Icon name="check-circle-outline" size={24} color="#fff" />
            <Text style={styles.successText}>Attendance Sent!</Text>
          </View>
        </Animated.View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Matric Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your matric number"
                placeholderTextColor={THEME.textSecondary}
                value={matricNumber}
                onChangeText={setMatricNumber}
                autoCapitalize="characters"
              />
              {matricNumber.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => setMatricNumber('')}
                >
                  <Icon name="close-circle" size={20} color={THEME.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.button, isMarking && styles.buttonDisabled]}
              onPress={markAttendance}
              disabled={isMarking}
            >
              {isMarking ? (
                <ActivityIndicator size="small" color={THEME.text} />
              ) : (
                <View style={styles.buttonContent}>
                  <Icon name={biometricAvailable ? "fingerprint" : "check-circle"} size={24} color={THEME.text} />
                  <Text style={styles.buttonText}>
                    {isMarking ? 'Marking...' : `Mark with ${biometricAvailable ? biometricType : 'PIN'}`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* PIN Authentication Modal */}
        <Modal
          visible={showPinModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPinModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enter PIN</Text>
                <TouchableOpacity onPress={() => {
                  setShowPinModal(false);
                  setPin('');
                  setPinError('');
                }}>
                  <Icon name="close" size={24} color={THEME.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalText}>Please enter your PIN to mark attendance</Text>
              
              <TextInput
                style={styles.pinInput}
                placeholder="Enter PIN (default: 1234)"
                placeholderTextColor={THEME.textSecondary}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={4}
              />
              
              {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
              
              <TouchableOpacity 
                style={styles.pinButton}
                onPress={verifyPin}
                disabled={pin.length < 4}
              >
                <Text style={styles.pinButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.networkInfoContainer}>
          <Text style={styles.networkInfoTitle}>Connection Information</Text>
          
          <View style={styles.networkInfoSection}>
            <Icon name="wifi" size={24} color={THEME.accent} style={styles.networkIcon} />
            <Text style={styles.networkInfoText}>
              Make sure you're on the same WiFi network as your lecturer
            </Text>
          </View>
          
          {lastMarkedTime && (
            <View style={styles.lastMarkedContainer}>
              <Icon name="clock-check-outline" size={20} color={THEME.accent} style={styles.networkIcon} />
              <Text style={styles.lastMarkedText}>
                Last marked: {lastMarkedTime}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  label: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.darker,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.accent + '40', // 25% opacity
  },
  input: {
    flex: 1,
    color: THEME.text,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  clearButton: {
    padding: SPACING.sm,
  },
  button: {
    backgroundColor: THEME.accent,
    padding: SPACING.md,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  modalText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.lg,
    fontFamily: FONTS.regular,
  },
  pinInput: {
    backgroundColor: THEME.darker,
    color: THEME.text,
    padding: SPACING.md,
    borderRadius: 8,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#F44336',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  pinButton: {
    backgroundColor: THEME.accent,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  pinButtonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  successNotification: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50', // Green color
    zIndex: 10,
    padding: SPACING.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: '#FFFFFF', // White text
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginLeft: SPACING.sm,
  },
  lastMarkedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: THEME.darker,
  },
  lastMarkedText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
  networkInfoContainer: {
    flex: 1,
    marginTop: SPACING.lg,
  },
  networkInfoTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  networkInfoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  networkIcon: {
    marginRight: SPACING.md,
    marginTop: 2,
  },
  networkInfoText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    flex: 1,
    lineHeight: 22,
  },
});