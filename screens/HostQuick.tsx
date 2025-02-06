import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const THEME = {
  dark: '#1A1A1A',
  text: '#FFFFFF',
  accent: '#7C4DFF',
};

const SERVICE_UUID = '00001234-0000-1000-8000-00805F9B34FB'; // Unique service UUID
const CHARACTERISTIC_UUID = '00001235-0000-1000-8000-00805F9B34FB'; // Unique characteristic UUID

const bleManager = new BleManager();

export function LecturerBluetoothScreen() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Start advertising as a Bluetooth peripheral
    bleManager.startAdvertising({
      serviceUUIDs: [SERVICE_UUID],
      localName: 'AttendanceSession',
    });

    // Set up a characteristic to receive data
    bleManager.start({
      services: [
        {
          uuid: SERVICE_UUID,
          characteristics: [
            {
              uuid: CHARACTERISTIC_UUID,
              properties: ['read', 'write'],
              permissions: ['readable', 'writable'],
              onWriteRequest: (data) => {
                const studentData = JSON.parse(data.value);
                setStudents((prev) => [...prev, studentData]);
              },
            },
          ],
        },
      ],
    });

    // Clean up on unmount
    return () => {
      bleManager.stopAdvertising();
      bleManager.stop();
    };
  }, []);

  const renderStudent = ({ item }) => (
    <View style={styles.studentItem}>
      <Text style={styles.studentName}>{item.id}</Text>
      <Text style={styles.studentTime}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Session</Text>
      <Text style={styles.subtitle}>Students marked present:</Text>

      <FlatList
        data={students}
        keyExtractor={(item) => item.timestamp}
        renderItem={renderStudent}
        contentContainerStyle={styles.studentList}
        ListEmptyComponent={
          <Text style={styles.noStudents}>No students have marked attendance yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.dark,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.text,
    marginBottom: 16,
  },
  studentList: {
    flexGrow: 1,
  },
  studentItem: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    color: THEME.text,
  },
  studentTime: {
    fontSize: 14,
    color: '#B3B3B3',
  },
  noStudents: {
    textAlign: 'center',
    color: '#B3B3B3',
    fontSize: 16,
    marginTop: 24,
  },
});