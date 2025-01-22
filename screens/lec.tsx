// screens/LecturerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
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

  useEffect(() => {
    return () => {
      closeSession();
    };
  }, []);

  const closeSession = () => {
    if (session?.socket) {
      if (session.broadcastInterval) {
        clearInterval(session.broadcastInterval);
      }
      session.socket.close();
      setSession(null);
      setPresentStudents([]);
      setConnectionStatus('');
    }
  };

  const startSession = () => {
    const server = UdpSocket.createSocket('udp4');
    const sessionId = `SES${Math.floor(Math.random() * 10000)}`;

    server.on('message', (data: Buffer, rinfo: any) => {
      try {
        const studentData = JSON.parse(data.toString());
        setPresentStudents(prev => {
          if (!prev.find(student => student.id === studentData.id)) {
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
      setConnectionStatus(`Session ${sessionId} active - Port ${port}`);
      
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header
        title="Attendance Monitor"
        subtitle={session ? `${presentStudents.length} students present` : 'No active session'}
      />
      
      <View style={styles.sessionCard}>
        <View style={styles.iconContainer}>
          <Icon 
            name={session ? 'access-point' : 'access-point-off'} 
            size={40} 
            color={session ? THEME.accent : THEME.textSecondary} 
          />
        </View>
        <Text style={styles.sessionStatus}>
          {session ? 'Session Active' : 'No Active Session'}
        </Text>
        <StatusBadge status={connectionStatus || 'No active session'} />
      </View>

      {!session ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: THEME.accent }]}
          onPress={startSession}>
          <Icon name="plus-circle" size={24} color={THEME.text} />
          <Text style={styles.actionButtonText}>Start New Session</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.sessionContent}>
          <View style={styles.sectionHeader}>
            <Icon name="account-group" size={24} color={THEME.accent} />
            <Text style={styles.sectionTitle}>Present Students</Text>
          </View>
          <FlatList
            data={presentStudents}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <StudentListItem item={item} />}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="account-group-outline" size={48} color={THEME.textSecondary} />
                <Text style={styles.emptyText}>No students present yet</Text>
              </View>
            }
          />
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: THEME.error }]}
            onPress={closeSession}>
            <Icon name="stop-circle" size={24} color={THEME.text} />
            <Text style={styles.actionButtonText}>End Session</Text>
          </TouchableOpacity>
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
});