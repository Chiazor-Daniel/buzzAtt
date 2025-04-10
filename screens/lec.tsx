import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
} from 'react-native';
import RNFS from 'react-native-fs';
import UdpSocket from 'react-native-udp';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { Header } from '../components/utils';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

type Student = {
  matricNumber: string;
  ip: string;
  timestamp: number;
};

export function LecturerScreen({ navigation }: { navigation: any }) {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  
  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for elapsed time
  useEffect(() => {
    if (isSessionActive) {
      // Start the timer to update elapsed time every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      // Stop the timer when session is inactive
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSessionActive, sessionStartTime]);



  const startListening = () => {
    setIsLoading(true);
    try {
      // Close any existing socket first
      if (socket) {
        try {
          socket.removeAllListeners('message');
          socket.close();
        } catch (error) {
          console.error('Error closing existing socket:', error);
        }
      }
      
      const newSocket = new UdpSocket.Socket({ type: 'udp4' });
      
      // Handle errors
      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
        Toast.show({
          type: 'error',
          text1: 'Socket Error',
          text2: 'There was a problem with the connection'
        });
      });
      
      // Bind to port 3000
      newSocket.bind(3000, '0.0.0.0', () => {
        console.log('Socket bound to port 3000');
        setIsSessionActive(true);
        setSessionStartTime(Date.now());
        setIsLoading(false);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Attendance session started'
        });
      });

      // Listen for broadcasts
      newSocket.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          console.log('Received message:', data);
          if (data.type === 'mark_attendance') {
            setStudents(prev => {
              // Check if student already marked attendance
              const exists = prev.some(s => s.matricNumber === data.matricNumber);
              if (!exists) {
                // Add new student
                return [...prev, {
                  matricNumber: data.matricNumber,
                  ip: rinfo.address,
                  timestamp: data.timestamp
                }];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error setting up socket:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start attendance session'
      });
      setIsLoading(false);
    }
  };

  const stopListening = () => {
    if (socket) {
      try {
        // Remove all listeners before closing to prevent errors
        socket.removeAllListeners('message');
        socket.once('close', () => {
          console.log('Socket closed successfully');
        });
        socket.close();
        
        // Add a small delay before setting socket to null
        // This gives time for any pending operations to complete
        setTimeout(() => {
          setSocket(null);
        }, 300);
        
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setIsSessionActive(false);
        
        Toast.show({
          type: 'info',
          text1: 'Session Ended',
          text2: `${students.length} students marked attendance`
        });
      } catch (error) {
        console.error('Error closing socket:', error);
        setSocket(null);
        setIsSessionActive(false);
        
        // Make sure to stop the timer even if there's an error
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  const clearStudentList = () => {
    Alert.alert(
      'Clear Student List',
      'Are you sure you want to clear the list of present students?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setStudents([]);
            Toast.show({
              type: 'success',
              text1: 'List Cleared',
              text2: 'Student list has been cleared'
            });
          }
        },
      ]
    );
  };

  const exportToCSV = async () => {
    if (students.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No Data',
        text2: 'There are no students to export'
      });
      return;
    }

    setIsExporting(true);

    try {
      // Request storage permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'Storage permission is required to export data'
          });
          setIsExporting(false);
          return;
        }
      }

      // Format data as CSV
      const headers = 'Matric Number,Time,IP Address\n';
      const rows = students.map(student => {
        const time = new Date(student.timestamp).toLocaleString();
        return `${student.matricNumber},${time},${student.ip}`;
      }).join('\n');
      const csvContent = headers + rows;

      // Create filename with current date
      const date = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `attendance_${date}_${time}.csv`;
      
      // Path to save file
      const path = Platform.OS === 'ios' 
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // Write file
      await RNFS.writeFile(path, csvContent, 'utf8');

      Toast.show({
        type: 'success',
        text1: 'Export Successful',
        text2: `Saved to ${Platform.OS === 'ios' ? 'Documents' : 'Downloads'}/${fileName}`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not export attendance data'
      });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (socket) {
        try {
          // Clean up socket properly when component unmounts
          socket.removeAllListeners('message');
          socket.once('close', () => {
            console.log('Socket closed on unmount');
          });
          socket.close();
        } catch (error) {
          console.error('Error closing socket on unmount:', error);
        }
      }
    };
  }, [socket]);

  // This function is now only used for initial calculation
  // The actual displayed time comes from the elapsedTime state
  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderStudent = ({ item, index }: { item: Student, index: number }) => {
    // Calculate how recent this attendance mark is (for highlighting new entries)
    const isRecent = Date.now() - item.timestamp < 5000; // Less than 5 seconds old
    
    return (
      <View 
        style={[styles.studentCard, isRecent && styles.studentCardHighlight]}
      >
        <View style={styles.studentInfo}>
          <Text style={styles.matricNumber}>{item.matricNumber}</Text>
          <Text style={styles.ipAddress}>{item.ip}</Text>
        </View>
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
          {isRecent && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.screenTitle}>Lecturer Attendance</Text>
        
        {!isSessionActive ? (
          <TouchableOpacity 
            style={styles.sessionInfoCard}
            onPress={startListening}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={THEME.accent} />
            ) : (
              <View style={styles.startSessionContent}>
                <View style={styles.playIconContainer}>
                  <Icon name="play" size={32} color={THEME.accent} />
                </View>
                <Text style={styles.startListeningText}>Start Listening</Text>
                <Text style={styles.startListeningSubtext}>Tap to begin attendance session</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.sessionInfoCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>Session Active - {elapsedTime}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.stopButton}
                onPress={stopListening}
              >
                <Icon name="stop-circle" size={24} color={THEME.text} />
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.studentsContainer}>
          <View style={styles.studentListHeader}>
            <View style={styles.studentCountContainer}>
              <Text style={styles.studentsTitle}>Present Students</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{students.length}</Text>
              </View>
            </View>
            <View style={styles.listActions}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={clearStudentList}
                disabled={students.length === 0}
              >
                <Icon 
                  name="delete-outline" 
                  size={22} 
                  color={THEME.textSecondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={exportToCSV}
                disabled={isExporting || students.length === 0}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={THEME.accent} />
                ) : (
                  <Icon 
                    name="export-variant" 
                    size={22} 
                    color={THEME.textSecondary} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="account-question" size={48} color={THEME.textSecondary} />
              <Text style={styles.emptyStateText}>No students have marked attendance yet</Text>
            </View>
          ) : (
            <FlatList
              data={students}
              renderItem={renderStudent}
              keyExtractor={(item) => item.matricNumber}
              contentContainerStyle={styles.studentsList}
            />
          )}
        </View>
      </ScrollView>
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
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  screenTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.lg,
  },
  sessionInfoCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.accent,
    minHeight: 150,
    justifyContent: 'center',
  },
  startSessionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(111, 76, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  startListeningText: {
    color: THEME.accent,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  startListeningSubtext: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
    backgroundColor: '#4CAF50', // Green
  },
  statusText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  studentsContainer: {
    marginTop: SPACING.lg,
    minHeight: 300,
  },
  studentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  studentCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentsTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginRight: SPACING.sm,
  },
  countBadge: {
    backgroundColor: THEME.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: THEME.text,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  listActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  studentsList: {
    paddingBottom: SPACING.md,
  },
  studentCard: {
    backgroundColor: THEME.card,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.accent,
    backgroundColor: THEME.card + 'F5', // Slightly lighter
  },
  studentInfo: {
    flex: 1,
  },
  matricNumber: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  ipAddress: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  newBadge: {
    backgroundColor: THEME.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  newBadgeText: {
    color: THEME.text,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});