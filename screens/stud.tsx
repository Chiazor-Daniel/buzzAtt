import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import UdpSocket from 'react-native-udp';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { Header } from '../components/utils';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

export function StudentScreen({ navigation }) {
  const [matricNumber, setMatricNumber] = useState<string>('');
  const [isMarking, setIsMarking] = useState<boolean>(false);

  const markAttendance = () => {
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
    
    // Bind to any available port
    socket.bind(0, '0.0.0.0', () => {
      console.log('Socket bound to random port');
      
      const attendanceData = JSON.stringify({
        type: 'mark_attendance',
        matricNumber: matricNumber.trim(),
        timestamp: Date.now()
      });

      console.log('Sending attendance data:', attendanceData);

      // Broadcast to all devices on port 3000
      socket.send(attendanceData, 0, attendanceData.length, 3000, '255.255.255.255', (err) => {
        if (err) {
          console.error('Error sending attendance:', err);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to mark attendance'
          });
        } else {
          console.log('Attendance data sent successfully');
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Attendance marked'
          });
        }
        setIsMarking(false);
        socket.close();
      });
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header title="Student Attendance" />
      
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Matric Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your matric number"
            placeholderTextColor={THEME.textSecondary}
            value={matricNumber}
            onChangeText={setMatricNumber}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isMarking && styles.buttonDisabled]}
          onPress={markAttendance}
          disabled={isMarking}
        >
          <Icon name="check-circle" size={24} color={THEME.text} />
          <Text style={styles.buttonText}>
            {isMarking ? 'Marking...' : 'Mark Attendance'}
          </Text>
        </TouchableOpacity>
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
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  label: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  input: {
    backgroundColor: THEME.card,
    color: THEME.text,
    padding: SPACING.md,
    borderRadius: 8,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    padding: SPACING.md,
    borderRadius: 8,
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
});