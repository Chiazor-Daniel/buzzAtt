import { useState, useEffect, useCallback } from 'react';
import UdpSocket from 'react-native-udp';
import { Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';

export const useStudentAttendance = () => {
  const [matricNumber, setMatricNumber] = useState<string>('');
  const [lecturerIP, setLecturerIP] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false); // For success animation trigger
  const [lastMarkedTime, setLastMarkedTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null); // For displaying errors if needed

  // Lecturer Discovery
  useEffect(() => {
    const discoverySocket = new UdpSocket.Socket({ type: 'udp4', reusePort: true }); // Added reusePort
    let isMounted = true;

    discoverySocket.on('error', (err) => {
        console.error('Discovery socket error:', err);
        // Optionally set an error state here if needed for UI feedback
    });
    
    discoverySocket.bind(3001, '0.0.0.0', () => {
      console.log('Student discovery socket bound to 3001');
    });

    discoverySocket.on('message', (msg, rinfo) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'lecturer_here' || data.type === 'lecturer_presence') { // Listen for presence too
          console.log('Lecturer presence detected at IP:', rinfo.address);
          setLecturerIP(rinfo.address);
        }
      } catch (e) {
        console.log("Error processing discovery message:", e);
      }
    });

    return () => {
      isMounted = false;
      try {
        discoverySocket.close(() => console.log('Discovery socket closed.'));
      } catch(e) {
        console.error('Error closing discovery socket:', e);
      }
    };
  }, []);

  const submitAttendance = useCallback(async () => { // Renamed from sendAttendanceData for clarity
    if (!matricNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Input Required', text2: 'Please enter your matric number.' });
      setError('Please enter your matric number.');
      return false; // Indicate failure
    }

    Keyboard.dismiss();
    setIsMarking(true);
    setIsSuccess(false); // Reset success state
    setError(null);     // Reset error state

    // It's better to create a new socket for each send attempt to avoid state issues
    // This socket is short-lived.
    const PTPsocket = new UdpSocket.Socket({ type: 'udp4' });
    let PTPsocketClosed = false;

    const closePtpSocket = () => {
        if (!PTPsocketClosed) {
            try {
                PTPsocket.close(() => console.log('PTP attendance socket closed.'));
                PTPsocketClosed = true;
            } catch(e) {
                console.error('Error closing PTP socket:', e);
            }
        }
    };
    
    PTPsocket.on('error', (err) => {
        console.error('PTP attendance socket error:', err);
        setIsMarking(false);
        setError('Network error during attendance marking.');
        Toast.show({ type: 'error', text1: 'Network Error', text2: 'Could not send attendance.' });
        closePtpSocket();
    });

    // Bind to an ephemeral port (0)
    PTPsocket.bind(0, '0.0.0.0', () => {
      const attendanceData = JSON.stringify({
        type: 'mark_attendance',
        matricNumber: matricNumber.trim(),
        timestamp: Date.now(),
      });

      const handleUdpSuccess = () => {
        if (PTPsocketClosed) return;
        setIsMarking(false);
        setIsSuccess(true);
        setLastMarkedTime(new Date().toLocaleTimeString());
        setError(null);
        Toast.show({ type: 'success', text1: 'Attendance Marked', text2: 'Your attendance has been recorded.' });
        closePtpSocket();
        return true; // Indicate success
      };

      const handleUdpFailure = (specificError?: string) => {
        if (PTPsocketClosed) return;
        setIsMarking(false);
        setIsSuccess(false);
        const errorMessage = specificError || 'Failed to mark attendance. Please try again.';
        setError(errorMessage);
        Toast.show({ type: 'error', text1: 'Submission Failed', text2: errorMessage });
        closePtpSocket();
        return false; // Indicate failure
      };

      const sendBroadcast = () => {
        const addresses = ['255.255.255.255', '192.168.1.255', '192.168.43.255']; // Common broadcast IPs
        let attempts = 0;
        const maxAttempts = addresses.length;

        const trySend = () => {
          if (PTPsocketClosed || attempts >= maxAttempts) {
            if (!PTPsocketClosed) handleUdpFailure('Could not reach lecturer via broadcast.');
            return;
          }

          const address = addresses[attempts];
          attempts++;
          console.log(`Attempting broadcast to ${address}, attempt ${attempts}/${maxAttempts}`);
          PTPsocket.send(attendanceData, 0, attendanceData.length, 3000, address, (err) => {
            if (PTPsocketClosed) return;
            if (err) {
              console.error(`Error sending broadcast to ${address}:`, err);
              if (attempts < maxAttempts) {
                trySend(); // Try next address
              } else {
                handleUdpFailure('Broadcast attempts failed.');
              }
            } else {
              console.log(`Attendance broadcast to ${address} successful.`);
              handleUdpSuccess();
            }
          });
        };
        trySend();
      };

      if (lecturerIP) {
        console.log(`Attempting direct send to lecturer IP: ${lecturerIP}`);
        PTPsocket.send(attendanceData, 0, attendanceData.length, 3000, lecturerIP, (err) => {
          if (PTPsocketClosed) return;
          if (err) {
            console.warn(`Direct send to ${lecturerIP} failed: ${err}. Falling back to broadcast.`);
            sendBroadcast();
          } else {
            console.log(`Direct send to ${lecturerIP} successful.`);
            handleUdpSuccess();
          }
        });
      } else {
        console.log('No lecturer IP known. Proceeding with broadcast.');
        sendBroadcast();
      }
    });
     // Add a timeout for the PTP socket operations
     const timeoutId = setTimeout(() => {
        if (!PTPsocketClosed) {
            console.warn('PTP attendance socket operation timed out.');
            setIsMarking(false);
            setError('Attendance marking timed out. Please check network and try again.');
            Toast.show({ type: 'error', text1: 'Timeout', text2: 'Attendance marking timed out.' });
            closePtpSocket();
        }
    }, 10000); // 10 second timeout

    // Clear timeout if socket closes sooner
    PTPsocket.on('close', () => clearTimeout(timeoutId));


    // This async function itself doesn't directly return success/failure of UDP,
    // as UDP is connectionless. State updates (isSuccess, error) will reflect outcome.
  }, [matricNumber, lecturerIP]);

  return {
    matricNumber,
    setMatricNumber,
    isMarking,
    isSuccess, // For UI feedback (e.g., animation)
    lastMarkedTime,
    lecturerIP, // Mostly for informational display if needed
    submitAttendance,
    error, // General error message from the hook
    setIsSuccess, // Allow component to reset success (e.g., after animation)
  };
}; 