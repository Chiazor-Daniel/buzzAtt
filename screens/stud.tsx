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
import { StatusBadge, Header } from '../components/utils';
import ReactNativeBiometrics from 'react-native-biometrics';
// import { FloatingModeSwitch } from '../App';
import { useAuthStore } from '../store';
import { checkAuth } from '../custom-hooks/useProfile';

type AvailableSession = {
  id: string;
  port: number;
};

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
};
const DEFAULT_PIN = '0000';

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

export function StudentScreen({navigation}) {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [studentId] = useState<string>(`CSI - 14327`);
  const [socket, setSocket] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pin, setPin] = useState('');
  const [selectedPort, setSelectedPort] = useState<number | null>(null);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const { studentProfile } = useAuthStore();

  console.log(studentProfile && studentProfile)

  // Generate avatar text from matric number
  const getAvatarText = () => {
    if (!studentProfile?.matricNumber) return 'NA';
    const matric = studentProfile.matricNumber;
    return `${matric.charAt(0)}${matric.charAt(matric.length - 1)}`.toUpperCase();
  };

  useEffect(() => {
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

  const initiateAttendanceMarking = (port: number) => {
    setSelectedPort(port);
    setShowAuthModal(true);
  };

  const setupSocket = () => {
    if (socket) return socket;

    const client = UdpSocket.createSocket('udp4');

    client.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'session-broadcast') {
          setAvailableSessions(prev => {
            if (!prev.find(session => session.id === message.sessionId)) {
              return [...prev, { id: message.sessionId, port: message.port }];
            }
            return prev;
          });
        } else if (message.status === 'success') {
          setConnectionStatus('✅ Attendance marked successfully!');
          Toast.show({
            type: 'success',
            text1: 'Attendance Marked',
            text2: 'Your attendance has been successfully recorded.',
          });
        }
      } catch (error) {
        console.error('Error processing response:', error);
      }
    });

    client.on('error', (err: Error) => {
      console.error('Client error:', err);
      Alert.alert('Error', 'Connection error occurred');
      setIsDiscovering(false);
    });

    try {
      client.bind(8887);
      return client;
    } catch (error) {
      console.error('Client binding error:', error);
      Alert.alert('Error', 'Could not start discovery');
      setIsDiscovering(false);
      return null;
    }
  };

  const toggleDiscovery = () => {
    if (isDiscovering) {
      setIsDiscovering(false);
      setConnectionStatus('');
      setAvailableSessions([]);
      if (socket) {
        socket.close();
        setSocket(null);
      }
    } else {
      setIsDiscovering(true);
      setConnectionStatus('Searching for active sessions...');
      const newSocket = setupSocket();
      setSocket(newSocket);
    }
  };

  const markAttendance = (sessionPort: number) => {
    if (!socket) return;

    const studentData = {
      id: studentId,
      timestamp: new Date().toISOString(),
    };

    try {
      socket.send(
        JSON.stringify(studentData),
        undefined,
        undefined,
        sessionPort,
        '255.255.255.255',
        (error: Error | null) => {
          if (error) {
            setConnectionStatus('❌ Failed to mark attendance');
            Toast.show({
              type: 'error',
              text1: 'Failed',
              text2: 'Unable to mark attendance. Please try again.',
            });
          } else {
            setConnectionStatus('⏳ Marking attendance...');
          }
        },
      );
    } catch (error) {
      console.error('Mark attendance error:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    }
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

  const renderSession = ({ item }: { item: AvailableSession }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => initiateAttendanceMarking(item.port)}
      activeOpacity={0.7}>
      <View style={styles.sessionIconContainer}>
        <Icon name="access-point" size={24} color={THEME.accent} />
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionId}>Session {item.id}</Text>
        <Text style={styles.sessionPort}>
          <Icon name="lan-connect" size={14} color={THEME.textSecondary} /> Port: {item.port}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={THEME.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.accent]} />
    }>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header 
        title="Student Attendance" 
        subtitle={`ID: ${studentProfile?.matricNumber || 'Not Available'}`} 
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
              { backgroundColor: isDiscovering ? THEME.error : THEME.success },
            ]}
            onPress={toggleDiscovery}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Icon
              name={isDiscovering ? 'stop-circle-outline' : 'magnify'}
              size={20}
              color={THEME.text}
            />
            <Text style={styles.discoveryButtonText}>
              {isDiscovering ? 'Stop Discovery' : 'Start Discovery'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {connectionStatus && <StatusBadge status={connectionStatus} />}

      <View style={styles.sessionsContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="access-point-network" size={24} color={THEME.accent} />
          <Text style={styles.sessionsTitle}>Available Sessions</Text>
        </View>
        <FlatList
          data={availableSessions}
          keyExtractor={item => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.sessionsList}
          refreshing={refreshing}
          onRefresh={onRefresh}
          nestedScrollEnabled={true}
          
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {isDiscovering ? (
                <>
                  <ActivityIndicator size="large" color={THEME.accent} />
                  <Text style={styles.noSessions}>Searching for sessions...</Text>
                </>
              ) : (
                <>
                  <Icon name="access-point-network-off" size={48} color={THEME.textSecondary} />
                  <Text style={styles.noSessions}>Press "Start Discovery" to find sessions</Text>
                </>
              )}
            </View>
          }
        />
      </View>

      <Modal
        visible={showAuthModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Authentication Required</Text>

            {isBiometricSupported && (
              <TouchableOpacity style={styles.authButton} onPress={handleBiometricAuth}>
                <Icon name="fingerprint" size={24} color={THEME.text} />
                <Text style={styles.authButtonText}>Use Fingerprint</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.orText}>- OR -</Text>

            <TextInput
              style={styles.pinInput}
              placeholder="Enter PIN"
              placeholderTextColor={THEME.textSecondary}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.error }]}
                onPress={() => {
                  setShowAuthModal(false);
                  setPin('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.success }]}
                onPress={handlePinSubmit}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
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
    margin: 20,
    padding: 24,
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
    marginBottom: 16,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: '700',
  },
  profileId: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: THEME.text,
  },
  ipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileIp: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  sessionsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
    color: THEME.text,
  },
  sessionsList: {
    paddingBottom: 20,
  },
  sessionItem: {
    backgroundColor: THEME.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${THEME.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionId: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  sessionPort: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  noSessions: {
    textAlign: 'center',
    color: THEME.textSecondary,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  discoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  discoveryButtonText: {
    color: THEME.text,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  authButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  orText: {
    color: THEME.textSecondary,
    marginVertical: 16,
  },
  pinInput: {
    backgroundColor: THEME.dark,
    color: THEME.text,
    width: '100%',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 0.45,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
  toastSuccess: {
    backgroundColor: THEME.card,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: THEME.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toastError: {
    backgroundColor: THEME.card,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: THEME.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toastTextContainer: {
    marginLeft: 12,
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
  detailsContainer: {
    width: '100%',
    marginTop: 12,
    padding: 8,
    backgroundColor: THEME.dark,
    borderRadius: 8,
  },
  detailText: {
    color: THEME.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginVertical: 4,
  },
});