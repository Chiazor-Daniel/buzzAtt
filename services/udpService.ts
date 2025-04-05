import UdpSockets from 'react-native-udp';

class UDPService {
  private socket: any;
  private messageCallback: ((data: any) => void) | null = null;

  constructor() {
    this.socket = new UdpSockets.Socket({ type: 'udp4' });
    this.socket.bind(3000, () => {
      console.log('UDP socket bound to port 3000');
    });

    this.socket.on('message', (msg: any, rinfo: any) => {
      try {
        const data = JSON.parse(msg.toString());
        if (this.messageCallback) {
          this.messageCallback(data);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  setMessageCallback(callback: (data: any) => void) {
    this.messageCallback = callback;
  }

  markAttendance(studentName: string) {
    const attendanceData = JSON.stringify({
      type: 'mark_attendance',
      name: studentName,
      timestamp: Date.now()
    });

    this.socket.send(attendanceData, 0, attendanceData.length, 3000, '255.255.255.255', (err: any) => {
      if (err) {
        console.error('Error sending attendance:', err);
      }
    });
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const udpService = new UDPService(); 