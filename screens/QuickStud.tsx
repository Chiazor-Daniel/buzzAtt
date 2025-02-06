import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Toast from 'react-native-toast-message';

const THEME = {
  dark: '#1A1A1A',
  text: '#FFFFFF',
  accent: '#7C4DFF',
};

const SERVICE_UUID = '00001234-0000-1000-8000-00805F9B34FB'; // Same as host
const CHARACTERISTIC_UUID = '00001235-0000-1000-8000-00805F9B34FB'; // Same as host

const bleManager = new BleManager();

export function StudentBluetoothScreen() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Start scanning for devices when the screen mounts
    startScan();

    // Clean up on unmount
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

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
      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Attendance</Text>
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
        <Text style={styles.scanButtonText}>Scan for Devices</Text>
      </TouchableOpacity>
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
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 16,
    color: THEME.text,
  },
  noDevices: {
    textAlign: 'center',
    color: '#B3B3B3',
    fontSize: 16,
    marginTop: 24,
  },
  scanButton: {
    backgroundColor: THEME.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600',
  },
});