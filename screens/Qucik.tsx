import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useEffect, useState } from 'react';

const THEME = {
  dark: '#1A1A1A',
  text: '#FFFFFF',
  accent: '#7C4DFF',
};

const SERVICE_UUID = '00001234-0000-1000-8000-00805F9B34FB'; // Unique service UUID
const CHARACTERISTIC_UUID = '00001235-0000-1000-8000-00805F9B34FB'; // Unique characteristic UUID

const bleManager = new BleManager();

export function QuickAttendanceScreen({ mode }) {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (mode === 'lecturer') {
      // Host (Lecturer) logic
      bleManager.startAdvertising({
        serviceUUIDs: [SERVICE_UUID],
        localName: 'AttendanceSession',
      });

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

      return () => {
        bleManager.stopAdvertising();
        bleManager.stop();
      };
    } else {
      // Student logic
      startScan();
      return () => {
        bleManager.stopDeviceScan();
      };
    }
  }, [mode]);

  const startScan = () => {
    setIsScanning(true);
    setDevices([]);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }

      // Add the device to the list if it's not already there
      if (!devices.find((d) => d.id === device.id)) {
        setDevices((prev) => [...prev, device]);
      }
    });
  };

  const connectToDevice = async (device) => {
    try {
      const connectedDevice = await device.connect();
      const services = await connectedDevice.discoverAllServicesAndCharacteristics();

      // Send attendance data
      const attendanceData = JSON.stringify({ id: 'STU123', timestamp: new Date().toISOString() });
      await connectedDevice.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        attendanceData,
      );

      Toast.show({
        type: 'success',
        text1: 'Attendance Marked',
        text2: 'Your attendance has been successfully recorded.',
      });
    } catch (error) {
      console.error('Connection error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Unable to mark attendance. Please try again.',
      });
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
      <Icon name="bluetooth" size={24} color={THEME.accent} />
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
    </TouchableOpacity>
  );

  const renderStudent = ({ item }) => (
    <View style={styles.studentItem}>
      <Text style={styles.studentName}>{item.id}</Text>
      <Text style={styles.studentTime}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'student' ? 'Quick Attendance (Student)' : 'Quick Attendance (Lecturer)'}
      </Text>

      {mode === 'student' ? (
        <>
          <Text style={styles.subtitle}>Scan for nearby devices to mark attendance.</Text>

          {isScanning ? (
            <ActivityIndicator size="large" color={THEME.accent} />
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              renderItem={renderDevice}
              contentContainerStyle={styles.deviceList}
              ListEmptyComponent={
                <Text style={styles.noDevices}>No devices found. Start scanning to discover devices.</Text>
              }
            />
          )}

          <TouchableOpacity style={styles.scanButton} onPress={startScan}>
            <Icon name="magnify" size={24} color={THEME.text} />
            <Text style={styles.scanButtonText}>Scan for Devices</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
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
        </>
      )}
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
  deviceList: {
    flexGrow: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 16,
    color: THEME.text,
    marginLeft: 12,
  },
  noDevices: {
    textAlign: 'center',
    color: '#B3B3B3',
    fontSize: 16,
    marginTop: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    padding: 16,
    borderRadius: 8,
  },
  scanButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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