import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
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

export function LecturerScreen({ navigation }) {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = new UdpSocket.Socket({ type: 'udp4' });
    
    // Bind to port 3000
    newSocket.bind(3000, '0.0.0.0', () => {
      console.log('Socket bound to port 3000');
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
    setIsSessionActive(true);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.matricNumber}>{item.matricNumber}</Text>
        <Text style={styles.ipAddress}>{item.ip}</Text>
      </View>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header title="Lecturer Attendance" />
      
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <Icon 
            name={isSessionActive ? "access-point" : "access-point-off"} 
            size={24} 
            color={isSessionActive ? THEME.accent : THEME.textSecondary} 
          />
          <Text style={styles.statusText}>
            {isSessionActive ? 'Listening for attendance...' : 'Not active'}
          </Text>
        </View>

        <View style={styles.studentsContainer}>
          <Text style={styles.studentsTitle}>
            Present Students ({students.length})
          </Text>
          <FlatList
            data={students}
            renderItem={renderStudent}
            keyExtractor={(item) => item.matricNumber}
            contentContainerStyle={styles.studentsList}
          />
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.xl,
  },
  statusText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  studentsContainer: {
    flex: 1,
  },
  studentsTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.md,
    fontFamily: FONTS.bold,
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
  timestamp: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
});