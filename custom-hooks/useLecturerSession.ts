import { useState, useEffect, useRef, useCallback } from 'react';
import UdpSocket from 'react-native-udp';
import Toast from 'react-native-toast-message';
// Potentially import Student type if not defined globally
// import { Student } from '../types'; 

// Assuming Student type is defined something like this, or import from your types file
type Student = {
  matricNumber: string;
  ip: string;
  timestamp: number;
};

export const useLecturerSession = () => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [socket, setSocket] = useState<any>(null); // Consider more specific type if possible
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect for elapsed time
  useEffect(() => {
    if (isSessionActive && sessionStartTime > 0) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime('00:00'); // Reset timer display
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, sessionStartTime]);

  const startSession = useCallback(() => {
    setIsLoading(true);
    try {
      if (socket) {
        try {
          socket.removeAllListeners();
          socket.close();
        } catch (error) {
          console.error('Error closing existing socket before start:', error);
        }
      }
      
      const newSocket = new UdpSocket.Socket({ type: 'udp4', reusePort: true });

      newSocket.on('error', (err) => {
        console.error('Socket error in hook:', err);
        Toast.show({ type: 'error', text1: 'Socket Error', text2: 'Connection problem in session.' });
        setIsLoading(false);
        setIsSessionActive(false); // Ensure session is marked inactive on error
      });

      newSocket.bind(3000, '0.0.0.0', () => {
        console.log('Socket bound to port 3000 in hook');
        setSessionStartTime(Date.now());
        setIsSessionActive(true);
        setIsLoading(false);
        
        presenceIntervalRef.current = setInterval(() => {
          const presenceMsg = JSON.stringify({ type: 'lecturer_presence', timestamp: Date.now() });
          // Consider error handling for send if needed
          newSocket.send(presenceMsg, 0, presenceMsg.length, 3001, '255.255.255.255', (err) => {
            if (err) {
                console.error('Error sending presence message:', err);
            }
          });
        }, 3000);
        
        Toast.show({ type: 'success', text1: 'Session Started', text2: 'Listening for student attendance.' });
      });

      newSocket.on('message', (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'mark_attendance' && data.matricNumber) {
            setStudents(prev => {
              const exists = prev.some(s => s.matricNumber === data.matricNumber);
              if (!exists) {
                return [...prev, { matricNumber: data.matricNumber, ip: rinfo.address, timestamp: Date.now() }];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error processing message in hook:', error);
        }
      });
      
      newSocket.on('close', () => {
          console.log('Socket closed event received in hook.');
          if (presenceIntervalRef.current) {
            clearInterval(presenceIntervalRef.current);
            presenceIntervalRef.current = null;
          }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error setting up socket in hook:', error);
      Toast.show({ type: 'error', text1: 'Start Failed', text2: 'Could not start attendance session.' });
      setIsLoading(false);
      setIsSessionActive(false);
    }
  }, [socket]); // Added socket to dependency array, re-eval if socket instance changes externally (though it shouldn't here)

  const stopSession = useCallback(() => {
    if (socket) {
      try {
        socket.removeAllListeners(); // Remove all listeners first
        socket.close(() => { // socket.close can take a callback
            console.log('Socket closed successfully via stopSession');
        });
        if (presenceIntervalRef.current) {
          clearInterval(presenceIntervalRef.current);
          presenceIntervalRef.current = null;
        }
        Toast.show({ type: 'info', text1: 'Session Ended', text2: `${students.length} students marked.` });
      } catch (error) {
        console.error('Error closing socket in hook:', error);
        Toast.show({ type: 'error', text1: 'Stop Failed', text2: 'Could not stop session cleanly.' });
      } finally {
        setSocket(null); // Crucial to set to null
        setIsSessionActive(false);
        // Timer cleanup is handled by its own useEffect based on isSessionActive
      }
    }
  }, [socket, students.length]);

  // Cleanup effect for when the hook is unmounted (e.g., screen is left)
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('Cleaning up socket on hook unmount.');
        socket.removeAllListeners();
        socket.close();
        if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket]); // Ensures cleanup if socket instance itself changes

  const clearStudents = useCallback(() => {
    // The Alert logic can remain in the component, or be passed as a callback if desired
    setStudents([]);
    Toast.show({
      type: 'success',
      text1: 'List Cleared',
      text2: 'Student list has been cleared'
    });
  }, []);

  return {
    isSessionActive,
    students,
    isLoadingSession: isLoading,
    elapsedTime,
    startSession,
    stopSession,
    clearStudents, // Exposing this function
  };
}; 