import { NetworkInfo } from 'react-native-network-info';
import Zeroconf from 'react-native-zeroconf';
import UdpSockets from 'react-native-udp';

interface AttendanceRecord {
  studentId: string;
  name: string;
  timestamp: number;
}

class AttendanceServer {
  private socket: any = null;
  private port: number = 3000;
  private zeroconf: Zeroconf;
  private connectedStudents: Map<string, AttendanceRecord> = new Map();
  private serviceName: string = '';

  constructor() {
    this.zeroconf = new Zeroconf();
  }

  async startServer(sessionName: string) {
    try {
      // Get local IP address
      const ipAddress = await NetworkInfo.getIPAddress();
      
      // Create UDP socket
      this.socket = new UdpSockets.Socket({ type: 'udp4' });
      
      // Bind socket to port
      this.socket.bind(this.port, ipAddress, () => {
        console.log(`Server running at udp://${ipAddress}:${this.port}`);
        
        // Generate unique service name
        this.serviceName = `attendance_${Date.now()}`;
        
        try {
          // Advertise service via Zeroconf
          this.zeroconf.publishService('_http._tcp', 'local', this.serviceName, this.port, {
            sessionName,
            studentCount: '0'
          });
        } catch (error) {
          console.error('Error publishing service:', error);
        }
      });

      // Handle incoming messages
      this.socket.on('message', (msg: Buffer, rinfo: any) => {
        try {
          const data = JSON.parse(msg.toString());
          
          if (data.type === 'mark_attendance') {
            const record: AttendanceRecord = {
              studentId: data.studentId,
              name: data.name,
              timestamp: Date.now()
            };
            
            this.connectedStudents.set(data.studentId, record);
            
            try {
              // Update service info with new student count
              this.zeroconf.unpublishService();
              this.zeroconf.publishService('_http._tcp', 'local', this.serviceName, this.port, {
                sessionName,
                studentCount: this.connectedStudents.size.toString()
              });
            } catch (error) {
              console.error('Error updating service:', error);
            }

            // Send response to student
            const response = JSON.stringify({
              type: 'attendance_response',
              success: true,
              message: 'Attendance marked successfully'
            });
            this.socket?.send(response, 0, response.length, rinfo.port, rinfo.address);

            // Broadcast update to all connected students
            const update = JSON.stringify({
              type: 'attendance_update',
              studentCount: this.connectedStudents.size,
              students: Array.from(this.connectedStudents.values())
            });
            this.socket?.send(update, 0, update.length, rinfo.port, rinfo.address);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

    } catch (error) {
      console.error('Error starting server:', error);
      throw error;
    }
  }

  stopServer() {
    try {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      if (this.serviceName) {
        this.zeroconf.unpublishService();
      }
      this.connectedStudents.clear();
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  }

  getConnectedStudents() {
    return Array.from(this.connectedStudents.values());
  }
}

export const attendanceServer = new AttendanceServer(); 