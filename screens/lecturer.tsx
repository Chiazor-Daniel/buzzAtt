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
      session.socket.close();
    }
    setIsSessionEnded(true);
  };

  const startSession = async () => {
    if (!sessionName) {
      Alert.alert('Error', 'Please enter a session name');
      return;
    }

    const port = Math.floor(Math.random() * (65535 - 1024) + 1024);
    const socket = new UdpSocket.Socket({ type: 'udp4' });

    // Listen for broadcasts
    socket.bind(port, () => {
      console.log('Socket bound to port', port);
    });

    socket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'mark_attendance') {
          setPresentStudents(prev => [...prev, {
            id: data.id,
            name: data.name,
            ip: rinfo.address,
            timestamp: data.timestamp
          }]);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    setSession({
      port,
      name: sessionName,
      message: sessionMessage,
      socket
    });
    setShowStartModal(false);
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