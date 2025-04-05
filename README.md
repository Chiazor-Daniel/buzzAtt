# Attendance System

A hybrid attendance tracking system that works with both web and mobile clients, using Socket.io for real-time communication and Zeroconf for local network service discovery.

## Features

- Create and manage attendance sessions
- Real-time attendance marking
- Local network service discovery
- Web interface for testing
- Mobile app support
- Cross-platform compatibility

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will start on port 3000 by default.

## Usage

### Web Interface

1. Open `http://localhost:3000` in your browser
2. Choose your role (Lecturer or Student)
3. For Lecturers:
   - Enter session name and optional message
   - Click "Start Session" to create a new session
4. For Students:
   - Enter your Student ID and Name
   - Click "Find Sessions" to discover available sessions
   - Click "Join Session" to mark attendance

### Mobile App

The mobile app can discover and join sessions created by either the web interface or other mobile devices on the same network.

#### Lecturer Mode:
1. Enter session details
2. Start session
3. Monitor attendance in real-time

#### Student Mode:
1. Start discovery to find available sessions
2. Select a session to join
3. Mark attendance

## Technical Details

- Uses Socket.io for real-time communication
- Zeroconf (mDNS/Bonjour) for service discovery
- Express.js web server
- React Native mobile app
- WebSocket transport for reliable communication

## Development

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

- `POST /api/sessions` - Create a new session
- `DELETE /api/sessions/:sessionId` - End a session
- `GET /api/sessions/:sessionId` - Get session details

## Socket.io Events

- `mark_attendance` - Mark attendance in a session
- `attendanceResponse` - Response to attendance marking
- `studentMarkedAttendance` - Notification when a student marks attendance

## License

MIT
