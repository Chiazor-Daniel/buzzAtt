import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import UdpSocket from 'react-native-udp';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StatusBadge, Header, StudentListItem } from '../components/utils';
import { StudentRecord, Session } from '../types';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';


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

export function LecturerScreen({ route, navigation }) {
  const { courseData } = route.params || {};
  const [session, setSession] = useState<Session | null>(null);
  const [presentStudents, setPresentStudents] = useState<StudentRecord[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>(courseData?.title || '');
  const [sessionMessage, setSessionMessage] = useState<string>('');
  const [isSessionEnded, setIsSessionEnded] = useState<boolean>(false);
  const [showStartModal, setShowStartModal] = useState<boolean>(false);

  useEffect(() => {
    if (courseData) {
      setSessionName(courseData.title || '');
    }
  }, [courseData]);


  const requestStoragePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to storage to save attendance data',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };
  

  
  const exportAttendance = async () => {
    try {
      let csvContent = "Student ID,IP Address,Timestamp\n";
      presentStudents.forEach(student => {
        csvContent += `${student.id},${student.ip},${student.timestamp}\n`;
      });
  
      const timestamp = new Date().getTime();
      const fileName = `${sessionName.replace(/\s+/g, '_')}_attendance_${timestamp}.csv`;
  
      // Use scoped storage for Android 10 and above
      const path = `${RNFS.ExternalStorageDirectoryPath}/Documents/${fileName}`;
  
      await RNFS.writeFile(path, csvContent, 'utf8');
  
      try {
        await Share.open({
          title: 'Export Attendance',
          url: `file://${path}`,
          type: 'text/csv',
          subject: `Attendance for ${sessionName}`,
        });
        Alert.alert('Success', 'Attendance record exported successfully!');
      } catch (shareError) {
        console.log('Share cancelled or error:', shareError);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export attendance');
    }
  };
  const endSession = () => {
    if (session?.socket) {
      if (session.broadcastInterval) {
        clearInterval(session.broadcastInterval);
      }
      session.socket.close();
      setSession(null);
      setIsSessionEnded(true);
    }
  };

  const startSession = () => {
    if (!sessionName.trim()) {
      Alert.alert('Error', 'Please enter a session name.');
      return;
    }

    setShowStartModal(false);

    const server = UdpSocket.createSocket('udp4');
    const sessionId = `SES${Math.floor(Math.random() * 10000)}`;

    server.on('message', (data: Buffer, rinfo: any) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.id) {
          const studentRecord: StudentRecord = {
            id: message.id,
            timestamp: message.timestamp,
            ip: rinfo.address,
          };
          setPresentStudents(prev => {
            if (!prev.find(student => student.id === message.id)) {
              // Send success response to student
              server.send(
                JSON.stringify({ 
                  status: 'success', 
                  message: 'Attendance marked successfully',
                  sessionName
                }),
                undefined,
                undefined,
                rinfo.port,
                rinfo.address,
                (error: Error | null) => {
                  if (error) {
                    console.error('Error sending response:', error);
                  }
                }
              );
              return [...prev, studentRecord];
            } else {
              // Send already marked response
              server.send(
                JSON.stringify({ 
                  status: 'success', 
                  message: 'Already marked present',
                  sessionName
                }),
                undefined,
                undefined,
                rinfo.port,
                rinfo.address,
                (error: Error | null) => {
                  if (error) {
                    console.error('Error sending response:', error);
                  }
                }
              );
              return prev;
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        // Send error response
        server.send(
          JSON.stringify({ 
            status: 'error', 
            message: 'Failed to process attendance'
          }),
          undefined,
          undefined,
          rinfo.port,
          rinfo.address,
          (error: Error | null) => {
            if (error) {
              console.error('Error sending error response:', error);
            }
          }
        );
      }
    });

    server.on('listening', () => {
      const port = server.address().port;
      console.log('Lecturer server listening on port:', port);
      setConnectionStatus(`Session ${sessionName} active - Port ${port}`);

      const broadcastInterval = setInterval(() => {
        const broadcastMessage = JSON.stringify({ 
          type: 'session-broadcast', 
          sessionName, 
          port,
          sessionId,
          message: sessionMessage,
          studentCount: presentStudents.length
        });
        console.log('Broadcasting session:', broadcastMessage);
        
        server.send(
          broadcastMessage,
          undefined,
          undefined,
          8887,
          '255.255.255.255',
          (error: Error | null) => {
            if (error) {
              console.error('Broadcast error:', error);
            }
          }
        );
      }, 5000);

      setSession({
        id: sessionId,
        socket: server,
        port,
        broadcastInterval,
        message: sessionMessage,
      });
    });

    server.on('error', (err: Error) => {
      console.error('Server error:', err);
      Alert.alert('Error', 'Server encountered an error');
    });

    try {
      console.log('Binding lecturer server to port 8888...');
      server.bind(8888);
      console.log('Lecturer server bound successfully');
    } catch (error) {
      console.error('Binding error:', error);
      Alert.alert('Error', 'Could not start attendance session');
    }
  };

 

  const closeMonitor = () => {
    setPresentStudents([]);
    setIsSessionEnded(false);
    setSessionName('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header
        title="Attendance Monitor"
        subtitle={session ? `${presentStudents.length} students present` : 'No active session'}
      />
      <View style={styles.sessionContent}>
        <View style={styles.sessionCard}>
          <View style={styles.iconContainer}>
            <Icon
              name={session ? 'access-point' : 'access-point-off'}
              size={40}
              color={session ? THEME.accent : THEME.textSecondary}
            />
          </View>
          <Text style={styles.sessionStatus}>
            {sessionName}
          </Text>
          <StatusBadge status={connectionStatus || 'No active session'} />
        </View>

        <View style={styles.sectionHeader}>
          <Icon name="account-group" size={24} color={THEME.accent} />
          <Text style={styles.sectionTitle}>Present Students</Text>
        </View>
        <FlatList
          data={presentStudents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <StudentListItem item={item} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="account-group-outline" size={48} color={THEME.textSecondary} />
              <Text style={styles.emptyText}>
                {session ? 'No students present yet' : 'Start a session to begin attendance'}
              </Text>
            </View>
          }
        />

        {isSessionEnded ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: THEME.success }]}
              onPress={exportAttendance}>
              <Icon name="file-export" size={24} color={THEME.text} />
              <Text style={styles.actionButtonText}>Export to CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: THEME.error, marginTop: 10 }]}
              onPress={closeMonitor}>
              <Icon name="close-circle" size={24} color={THEME.text} />
              <Text style={styles.actionButtonText}>Close Monitor</Text>
            </TouchableOpacity>
          </View>
        ) : session ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: THEME.error }]}
            onPress={endSession}>
            <Icon name="stop-circle" size={24} color={THEME.text} />
            <Text style={styles.actionButtonText}>End Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: THEME.accent }]}
            onPress={() => setShowStartModal(true)}>
            <Icon name="play-circle" size={24} color={THEME.text} />
            <Text style={styles.actionButtonText}>Start Session</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showStartModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStartModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start New Session</Text>
            <TextInput
              style={styles.input}
              placeholder="Session Name"
              placeholderTextColor={THEME.textSecondary}
              value={sessionName}
              onChangeText={setSessionName}
              autoFocus={true}
            />
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Session Message (Optional)"
              placeholderTextColor={THEME.textSecondary}
              value={sessionMessage}
              onChangeText={setSessionMessage}
              multiline={true}
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.error }]}
                onPress={() => setShowStartModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: THEME.accent }]}
                onPress={startSession}>
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  sessionSetup: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    backgroundColor: THEME.card,
    color: THEME.text,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
  },
  sessionCard: {
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${THEME.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionStatus: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
    color: THEME.text,
  },
  listContainer: {
    paddingBottom: 20,
  },
  actionButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.textSecondary,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    margin: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});