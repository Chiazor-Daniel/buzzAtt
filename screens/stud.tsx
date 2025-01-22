// screens/StudentScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  StatusBar,
} from 'react-native';
import UdpSocket from 'react-native-udp';
import { NetworkInfo } from 'react-native-network-info';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StatusBadge, Header } from '../components/utils';

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

export function StudentScreen() {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [studentId] = useState<string>(`STU${Math.floor(Math.random() * 10000)}`);
  const [socket, setSocket] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [availableSessions, setAvailableSessions] = useState<AvailableSession[]>([]);

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
    setupStudent();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const setupStudent = () => {
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
        }
      } catch (error) {
        console.error('Error processing response:', error);
      }
    });

    client.on('error', (err: Error) => {
      console.error('Client error:', err);
      Alert.alert('Error', 'Connection error occurred');
    });

    try {
      client.bind(8887);
      setSocket(client);
    } catch (error) {
      console.error('Client binding error:', error);
      Alert.alert('Error', 'Could not connect to session');
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

  const renderSession = ({ item }: { item: AvailableSession }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => markAttendance(item.port)}
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header title="Student Attendance" subtitle={`ID: ${studentId}`} />
      
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{studentId.slice(3, 5)}</Text>
        </View>
        <Text style={styles.profileId}>{studentId}</Text>
        <View style={styles.ipContainer}>
          <Icon name="ip-network" size={16} color={THEME.accent} />
          <Text style={styles.profileIp}>{ipAddress}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Icon 
            name={socket ? 'wifi-check' : 'wifi-alert'} 
            size={16} 
            color={socket ? THEME.success : THEME.warning} 
          />
          <Text style={[styles.statusText, { color: socket ? THEME.success : THEME.warning }]}>
            {socket ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>

      <StatusBadge status={connectionStatus || 'Searching for active sessions...'} />
      
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="access-point-network-off" size={48} color={THEME.textSecondary} />
              <Text style={styles.noSessions}>No active sessions found</Text>
            </View>
          }
        />
      </View>
    </View>
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
});