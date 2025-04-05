import Zeroconf from 'react-native-zeroconf';
import { io, Socket } from 'socket.io-client';
import { Session, StudentRecord } from '../types';
import { useAuthStore } from '../store';

interface ZeroconfService {
  name: string;
  host: string;
  port: number;
  addresses: string[];
  txt: Record<string, string>;
}

const zeroconf = new Zeroconf();

export const startDiscovery = (onServiceFound: (service: ZeroconfService) => void) => {
  zeroconf.on('resolved', (service: ZeroconfService) => {
    console.log('Service resolved:', service);
    onServiceFound(service);
  });

  zeroconf.on('error', (error: Error) => {
    console.error('Zeroconf error:', error);
  });

  zeroconf.scan(['_http._tcp.local.']);
};

export const stopDiscovery = () => {
  zeroconf.stop();
};

export const createSession = (port: number): Session => {
  const socket = io(`http://localhost:${port}`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    forceNew: true,
    autoConnect: true
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return {
    id: Math.random().toString(36).substring(7),
    socket,
    port,
  };
};

export const broadcastAttendance = (session: Session, studentRecord: StudentRecord) => {
  if (session.broadcastInterval) {
    clearInterval(session.broadcastInterval);
  }

  session.broadcastInterval = setInterval(() => {
    if (session.socket && session.socket.connected) {
      session.socket.emit('attendance', studentRecord);
      console.log('Broadcasting attendance:', studentRecord);
    }
  }, 5000); // Broadcast every 5 seconds
};

export const stopBroadcast = (session: Session) => {
  if (session.broadcastInterval) {
    clearInterval(session.broadcastInterval);
    session.broadcastInterval = undefined;
  }
  if (session.socket) {
    session.socket.disconnect();
  }
}; 