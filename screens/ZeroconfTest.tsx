import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList } from 'react-native';
import UdpSockets from 'react-native-udp';
import Toast from 'react-native-toast-message';

const ZeroconfTest = () => {
  const [isLecturer, setIsLecturer] = useState(true);
  const [sessionName, setSessionName] = useState('');
  const [connectedStudents, setConnectedStudents] = useState([]);
  const [socket, setSocket] = useState(null);

  // Initialize socket
  useEffect(() => {
    const sock = new UdpSockets.Socket({ type: 'udp4' });
    setSocket(sock);

    // Listen for broadcasts
    sock.bind(3000, () => {
      console.log('Socket bound to port 3000');
    });

    sock.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'mark_attendance') {
          setConnectedStudents(prev => [...prev, {
            name: data.name,
            timestamp: Date.now()
          }]);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    return () => {
      sock.close();
    };
  }, []);

  // Start session as lecturer
  const startSession = () => {
    if (!sessionName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a session name'
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Session Started',
      text2: 'Waiting for students...'
    });
  };

  // Mark attendance as student
  const markAttendance = () => {
    if (!socket) return;

    const attendanceData = JSON.stringify({
      type: 'mark_attendance',
      name: 'Student Name',
      timestamp: Date.now()
    });

    // Broadcast to all devices on the network
    socket.send(attendanceData, 0, attendanceData.length, 3000, '255.255.255.255', (err) => {
      if (err) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to mark attendance'
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Attendance marked'
        });
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance System</Text>
      <Button title={isLecturer ? "Switch to Student Mode" : "Switch to Lecturer Mode"} onPress={() => setIsLecturer(!isLecturer)} />

      {isLecturer ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter Session Name"
            value={sessionName}
            onChangeText={setSessionName}
          />
          <Button title="Start Session" onPress={startSession} />
          <Text style={styles.subtitle}>Connected Students:</Text>
          <FlatList
            data={connectedStudents}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.studentItem}>
                <Text>{item.name}</Text>
                <Text>{new Date(item.timestamp).toLocaleTimeString()}</Text>
              </View>
            )}
          />
        </>
      ) : (
        <>
          <Button title="Mark Attendance" onPress={markAttendance} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  studentItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  }
});

export default ZeroconfTest;