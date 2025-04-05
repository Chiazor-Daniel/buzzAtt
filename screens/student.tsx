import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  ScrollView,
  RefreshControl,
} from 'react-native';
import UdpSocket from 'react-native-udp';
import { NetworkInfo } from 'react-native-network-info';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { StatusBadge, Header, StudentListItem } from '../components/utils';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useAuthStore } from '../store';
import { checkAuth } from '../custom-hooks/useProfile';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

type AvailableSession = {
  id: string;
  port: number;
  sessionName: string;
  message?: string;
  studentCount?: number;
};

const DEFAULT_PIN = '1234';

// Toast configuration
const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.toastSuccess}>
      <Icon name="check-circle" size={24} color={THEME.success} />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastText1}>{text1}</Text>
        <Text style={styles.toastText2}>{text2}</Text>
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.toastError}>
      <Icon name="alert-circle" size={24} color={THEME.error} />
      <View style={styles.toastTextContainer}>
        <Text style={styles.toastText1}>{text1}</Text>
        <Text style={styles.toastText2}>{text2}</Text>
      </View>
    </View>
  ),
};

export function StudentScreen({ navigation }) {
  
  const { studentProfile } = useAuthStore();
  const [ipAddress, setIpAddress] = useState<string>('');
  const [studentId, setStudentId] = useState<string>(studentProfile?.matricNumber || '');
  const [socket, setSocket] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pin, setPin] = useState('');
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMatricModal, setShowMatricModal] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [markedSessions, setMarkedSessions] = useState<string[]>([]);

  console.log(studentProfile && studentProfile);

  // Generate avatar text from matric number
  const getAvatarText = () => {
    if (!studentProfile?.matricNumber) return 'NA';
    const matric = studentProfile.matricNumber;
    return `${matric.charAt(0)}${matric.charAt(matric.length - 1)}`.toUpperCase();
  };

  useEffect(() => {
    // if(studentId.length !> 0){
    //   setShowMatricModal(true)
    // }
    const getIpAddress = async () => {
      try {
        const ip = await NetworkInfo.getIPV4Address();
        setIpAddress(ip || 'Unknown IP');
      } catch (error) {
        console.error('Error getting IP:', error);
      }
    };

    getIpAddress();
    checkBiometricSupport();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const biometricAuth = new ReactNativeBiometrics();
      const { available } = await biometricAuth.isSensorAvailable();
      setIsBiometricSupported(available);
    } catch (error) {
      console.error('Biometric support check failed:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const biometricAuth = new ReactNativeBiometrics();
      const { success } = await biometricAuth.simplePrompt({
        promptMessage: 'Verify fingerprint to mark attendance',
      });

      if (success) {
        setShowAuthModal(false);
        if (selectedPort) {
          markAttendance(selectedPort);
        }
      }
    } catch (error) {
      console.error('Biometric auth failed:', error);
      Alert.alert('Authentication Failed', 'Please try using PIN instead');
    }
  };

  const handlePinSubmit = () => {
    if (pin === DEFAULT_PIN) {
      setShowAuthModal(false);
      setPin('');
      if (selectedPort) {
        markAttendance(selectedPort);
      }
    } else {
      Alert.alert('Invalid PIN', 'Please try again');
      setPin('');
    }
  };

  const handleMatricSubmit = (matricNumber: string) => {
    if (matricNumber.trim()) {
      setStudentId(matricNumber.trim());
      setShowMatricModal(false);
    } else {
      Alert.alert('Invalid Matric Number', 'Please enter a valid matric number');
    }
  };

  const initiateAttendanceMarking = (port: number) => {
    console.log('Initiating attendance marking for port:', port);
    setSelectedPort(port);
    setShowAuthModal(true);
  };

  const setupSocket = () => {
    if (socket) return socket;

    console.log('Setting up new student socket...');
    const client = UdpSocket.createSocket('udp4');

    client.on('message', (data: Buffer, rinfo: any) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'session-broadcast') {
          setAvailableSessions(prev => {
            if (!prev.find(session => session.id === message.sessionId)) {
              console.log('New session discovered:', message.sessionName);
              return [...prev, { 
                id: message.sessionId, 
                port: message.port,
                sessionName: message.sessionName,
                message: message.message,
                studentCount: message.studentCount
              }];
            }
            return prev;
          });
        } else if (message.status === 'success') {
          console.log('Attendance marked successfully:', message.message);
          setConnectionStatus('✅ ' + message.message);
          Toast.show({
            type: 'success',
            text1: 'Attendance Marked',
            text2: message.message,
          });
          setMarkedSessions(prev => [...prev, message.port?.toString()]);
          if (socket) {
            socket.close();
            setSocket(null);
          }
        } else if (message.status === 'error') {
          console.error('Attendance marking failed:', message.message);
          setConnectionStatus('❌ ' + message.message);
          Toast.show({
            type: 'error',
            text1: 'Failed',
            text2: message.message,
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    client.on('error', (err: Error) => {
      console.error('Connection error:', err);
      Alert.alert('Error', 'Connection error occurred');
      setIsDiscovering(false);
    });

    try {
      client.bind(8887);
      return client;
    } catch (error) {
      console.error('Socket binding error:', error);
      Alert.alert('Error', 'Could not start discovery');
      setIsDiscovering(false);
      return null;
    }
  };

  const toggleDiscovery = () => {
    if (isDiscovering) {
      console.log('Stopping discovery...');
      setIsDiscovering(false);
      setConnectionStatus('');
      setAvailableSessions([]);
      if (socket) {
        socket.close();
        setSocket(null);
      }
    } else {
      console.log('Starting discovery...');
      setIsDiscovering(true);
      setConnectionStatus('Searching for active sessions...');
      const newSocket = setupSocket();
      if (newSocket) {
        console.log('Discovery socket created successfully');
      } else {
        console.log('Failed to create discovery socket');
      }
      setSocket(newSocket);
    }
  };

  const markAttendance = async (port: number) => {
    if (!studentProfile?.matricNumber) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your matric number'
      });
      return;
    }

    const socket = new UdpSocket.Socket({ type: 'udp4' });
    
    const attendanceData = JSON.stringify({
      type: 'mark_attendance',
      id: studentProfile.matricNumber,
      name: studentProfile.name,
      timestamp: Date.now()
    });

    // Broadcast to all devices
    socket.send(attendanceData, 0, attendanceData.length, port, '255.255.255.255', (err) => {
      if (err) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to mark attendance'
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Attendance marked'
        });
        setMarkedSessions(prev => [...prev, port.toString()]);
      }
      socket.close();
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAuth();
    setRefreshing(false);
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (isDiscovering) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isDiscovering]);

  useEffect(() => {
    console.log('Available sessions updated:', availableSessions);
  }, [availableSessions]);

  const renderSession = ({ item }: { item: AvailableSession }) => {
    console.log('Rendering session:', item);
    const isMarked = markedSessions.includes(item.port.toString());
    
    return (
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionIconContainer}>
              <Icon name="access-point" size={24} color={THEME.accent} />
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{item.sessionName || `Session ${item.id}`}</Text>
              <Text style={styles.sessionPort}>
                <Icon name="lan-connect" size={14} color={THEME.textSecondary} /> Port: {item.port}
              </Text>
            </View>
          </View>
          
          <View style={styles.sessionDetails}>
            <View style={styles.detailRow}>
              <Icon name="clock-outline" size={16} color={THEME.textSecondary} />
              <Text style={styles.detailText}>Active Now</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="account-group" size={16} color={THEME.textSecondary} />
              <Text style={styles.detailText}>
                {item.studentCount !== undefined 
                  ? `${item.studentCount} student(s) present`
                  : 'Waiting for attendance'}
              </Text>
            </View>
            {item.message && (
              <View style={styles.messageContainer}>
                <Icon name="message-text-outline" size={16} color={THEME.textSecondary} />
                <Text style={styles.messageText}>{item.message}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.markAttendanceButton}
            onPress={() => {
              console.log('Session selected:', item);
              initiateAttendanceMarking(item.port);
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}>
            <Icon name="check-circle-outline" size={20} color={THEME.text} />
            <Text style={styles.markAttendanceText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.accent]} />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header 
        title="Student Attendance" 
        subtitle={`ID: ${studentProfile?.matricNumber || studentId}`} 
      />
      {/* <FloatingModeSwitch navigation={navigation} isLecturerMode={false} /> */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getAvatarText()}</Text>
        </View>
       
        <View style={styles.ipContainer}>
          <Icon name="ip-network" size={16} color={THEME.accent} />
          <Text style={styles.profileIp}>{ipAddress}</Text>
        </View>
        <View style={styles.detailsContainer}>
          {/* <Text style={styles.detailText}>
            Faculty: {studentProfile?.facultyId || 'N/A'}
          </Text> */}
          <Text style={styles.detailText}>
            {studentProfile?.departmentId || 'N/A'}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <TouchableOpacity
            style={[
              styles.discoveryButton,
              { 
                backgroundColor: isDiscovering 
                  ? THEME.error 
                  : studentId 
                    ? THEME.success 
                    : THEME.accent 
              },
            ]}
            onPress={studentId ? toggleDiscovery : () => setShowMatricModal(true)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon
                name={
                  isDiscovering 
                    ? 'stop-circle-outline' 
                    : studentId 
                      ? 'magnify' 
                      : 'card-account-details'
                }
                size={20}
                color={THEME.text}
              />
            </Animated.View>
            <Text style={styles.discoveryButtonText}>
              {isDiscovering 
                ? 'Stop Discovery' 
                : studentId 
                  ? 'Start Discovery' 
                  : 'Add Matric Number'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {connectionStatus && <StatusBadge status={connectionStatus} />}

      <View style={styles.sessionsContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="access-point-network" size={24} color={THEME.accent} />
          <Text style={styles.sectionTitle}>Available Sessions</Text>
          {isDiscovering && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                setAvailableSessions([]);
                setConnectionStatus('Refreshing sessions...');
              }}
            >
              <Icon name="refresh" size={20} color={THEME.accent} />
            </TouchableOpacity>
          )}
        </View>

        {isDiscovering && availableSessions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.accent} />
            <Text style={styles.loadingText}>Searching for active sessions...</Text>
          </View>
        ) : (
          <FlatList
            data={availableSessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            contentContainerStyle={styles.sessionsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="access-point-off" size={48} color={THEME.textSecondary} />
                <Text style={styles.emptyText}>
                  No active sessions found. Start discovery to find available sessions.
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Modal
        visible={showAuthModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Attendance</Text>
            <Text style={styles.modalSubtitle}>
              {isBiometricSupported ? 'Use fingerprint or PIN' : 'Enter PIN to verify'}
            </Text>

            {isBiometricSupported && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricAuth}
              >
                <Icon name="fingerprint" size={32} color={THEME.accent} />
                <Text style={styles.biometricText}>Use Fingerprint</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.pinInput}
              placeholder="Enter PIN"
              placeholderTextColor={THEME.textSecondary}
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.error }]}
                onPress={() => setShowAuthModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.accent }]}
                onPress={handlePinSubmit}
              >
                <Text style={styles.buttonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMatricModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMatricModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Matric Number</Text>
            <Text style={styles.modalSubtitle}>
              Please enter your matric number to continue
            </Text>

            <TextInput
              style={styles.matricInput}
              placeholder="Enter matric number"
              placeholderTextColor={THEME.textSecondary}
              value={studentId}
              onChangeText={setStudentId}
              autoFocus={true}
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: THEME.accent }]}
              onPress={() => handleMatricSubmit(studentId)}
            >
              <Text style={[styles.buttonText, { color: THEME.text }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast component */}
      <Toast config={toastConfig} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  profileCard: {
    backgroundColor: THEME.card,
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    color: THEME.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  ipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: `${THEME.darker}80`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  profileIp: {
    fontSize: FONT_SIZES.sm,
    color: THEME.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  detailsContainer: {
    width: '100%',
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: THEME.dark,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: THEME.accent,
  },
  detailText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginVertical: SPACING.xs,
    paddingLeft: SPACING.sm,
    fontFamily: FONTS.regular,
  },
  discoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 24,
    marginTop: SPACING.xl,
    width: '80%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  discoveryButtonText: {
    color: THEME.text,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  sessionsContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
    fontFamily: FONTS.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
    fontFamily: FONTS.regular,
  },
  sessionsList: {
    paddingBottom: SPACING.md,
  },
  sessionCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: THEME.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 77, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  sessionPort: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  sessionDetails: {
    backgroundColor: THEME.dark,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  markAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  markAttendanceText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontFamily: FONTS.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  modalSubtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  biometricButton: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  biometricText: {
    color: THEME.accent,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  pinInput: {
    width: '100%',
    height: 50,
    backgroundColor: THEME.dark,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xl,
    fontFamily: FONTS.regular,
  },
  matricInput: {
    width: '100%',
    height: 50,
    backgroundColor: THEME.dark,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xl,
    fontFamily: FONTS.regular,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
    minHeight: 48,
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  // Toast styles
  toastSuccess: {
    backgroundColor: THEME.card,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: THEME.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginHorizontal: 16,
  },
  toastError: {
    backgroundColor: THEME.card,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: THEME.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginHorizontal: 16,
  },
  toastTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toastText1: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  toastText2: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  refreshButton: {
    padding: SPACING.sm,
    borderRadius: 20,
    backgroundColor: `${THEME.accent}20`,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    backgroundColor: `${THEME.accent}10`,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  messageText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
    flex: 1,
    fontFamily: FONTS.regular,
  },
  markedButton: {
    backgroundColor: THEME.accent,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
});