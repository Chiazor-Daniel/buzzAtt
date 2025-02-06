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
} from 'react-native';
import UdpSocket from 'react-native-udp';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StatusBadge, Header, StudentListItem } from '../components/utils';
import { StudentRecord, Session } from '../types';

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

export function LecturerScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [presentStudents, setPresentStudents] = useState<StudentRecord[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [isSessionEnded, setIsSessionEnded] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isCounting) {
      endSession();
    }
    return () => clearInterval(timer);
  }, [isCounting, timeLeft]);

  const endSession = () => {
    if (session?.socket) {
      if (session.broadcastInterval) {
        clearInterval(session.broadcastInterval);
      }
      session.socket.close();
      setSession(null);
      setIsCounting(false);
      setIsSessionEnded(true);
    }
  };

  const startSession = () => {
    if (!sessionName.trim()) {
      Alert.alert('Error', 'Please enter a session name.');
      return;
    }

    const duration = parseInt(sessionDuration, 10);
    if (isNaN(duration) || duration <= 0 || duration > 30) {
      Alert.alert('Error', 'Please enter a valid duration (1-30 seconds).');
      return;
    }

    const server = UdpSocket.createSocket('udp4');
    const sessionId = `SES${Math.floor(Math.random() * 10000)}`;

    server.on('message', (data: Buffer, rinfo: any) => {
      try {
        const studentData = JSON.parse(data.toString());
        setPresentStudents((prev) => {
          if (!prev.find((student) => student.id === studentData.id)) {
            const newStudent = {
              id: studentData.id,
              ip: rinfo.address,
              timestamp: new Date().toLocaleTimeString(),
            };

            server.send(
              JSON.stringify({ status: 'success', sessionId }),
              undefined,
              undefined,
              rinfo.port,
              rinfo.address,
            );

            return [...prev, newStudent];
          }
          return prev;
        });
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    server.on('listening', () => {
      const port = server.address().port;
      setConnectionStatus(`Session ${sessionName} active - Port ${port}`);
      setTimeLeft(duration);
      setIsCounting(true);

      const broadcastInterval = setInterval(() => {
        server.send(
          JSON.stringify({ type: 'session-broadcast', sessionId, port }),
          undefined,
          undefined,
          8887,
          '255.255.255.255',
        );
      }, 2000);

      setSession({
        id: sessionId,
        socket: server,
        port,
        broadcastInterval,
      });
    });

    server.on('error', (err: Error) => {
      console.error('Server error:', err);
      Alert.alert('Error', 'Server encountered an error');
    });

    try {
      server.bind(8888);
    } catch (error) {
      console.error('Binding error:', error);
      Alert.alert('Error', 'Could not start attendance session');
    }
  };

  const saveAttendance = () => {
    // Simulate saving attendance (replace with actual logic)
    setIsSaved(true);
    Alert.alert('Success', 'Attendance record saved successfully!');
  };

  const closeMonitor = () => {
    setPresentStudents([]);
    setIsSessionEnded(false);
    setIsSaved(false);
    setSessionName('');
    setSessionDuration('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header
        title="Attendance Monitor"
        subtitle={session ? `${presentStudents.length} students present` : 'No active session'}
      />

      {!session && !isSessionEnded ? (
        <View style={styles.sessionSetup}>
          <TextInput
            style={styles.input}
            placeholder="Enter Session Name (e.g., Course Name)"
            placeholderTextColor={THEME.textSecondary}
            value={sessionName}
            onChangeText={setSessionName}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Duration (1-30 seconds)"
            placeholderTextColor={THEME.textSecondary}
            value={sessionDuration}
            onChangeText={setSessionDuration}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: THEME.accent }]}
            onPress={startSession}>
            <Icon name="plus-circle" size={24} color={THEME.text} />
            <Text style={styles.actionButtonText}>Start New Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
              {sessionName} - {timeLeft} seconds left
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
                <Text style={styles.emptyText}>No students present yet</Text>
              </View>
            }
          />

          {isSessionEnded && !isSaved ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: THEME.success }]}
              onPress={saveAttendance}>
              <Icon name="content-save" size={24} color={THEME.text} />
              <Text style={styles.actionButtonText}>Save Attendance</Text>
            </TouchableOpacity>
          ) : isSaved ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>Attendance saved successfully!</Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: THEME.error }]}
                onPress={closeMonitor}>
                <Icon name="close-circle" size={24} color={THEME.text} />
                <Text style={styles.actionButtonText}>Close Monitor</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: THEME.error }]}
              onPress={endSession}>
              <Icon name="stop-circle" size={24} color={THEME.text} />
              <Text style={styles.actionButtonText}>End Session</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  sessionSetup: {
    padding: 20,
  },
  input: {
    backgroundColor: THEME.card,
    color: THEME.text,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
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
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  successText: {
    color: THEME.success,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
});