// import React, {useState, useEffect} from 'react';
// import type {PropsWithChildren} from 'react';
// import {
//   SafeAreaView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   useColorScheme,
//   View,
//   TouchableOpacity,
//   FlatList,
//   Alert,
//   Dimensions,
//   ActivityIndicator,
//   Platform,
// } from 'react-native';

// import {Colors} from 'react-native/Libraries/NewAppScreen';
// import UdpSocket from 'react-native-udp';
// import {NetworkInfo} from 'react-native-network-info';

// type StudentRecord = {
//   id: string;
//   ip: string;
//   timestamp: string;
// };

// type HeaderProps = PropsWithChildren<{
//   title: string;
//   subtitle?: string;
// }>;

// const windowHeight = Dimensions.get('window').height;

// function Header({title, subtitle}: HeaderProps): React.JSX.Element {
//   const isDarkMode = useColorScheme() === 'dark';
//   return (
//     <View style={styles.headerContainer}>
//       <Text style={[styles.headerTitle, {color: isDarkMode ? Colors.white : Colors.black}]}>
//         {title}
//       </Text>
//       {subtitle && (
//         <Text style={[styles.headerSubtitle, {color: isDarkMode ? Colors.light : Colors.dark}]}>
//           {subtitle}
//         </Text>
//       )}
//     </View>
//   );
// }

// function StatusBadge({status}: {status: string}) {
//   const getStatusColor = () => {
//     if (status.includes('✅')) return '#4CAF50';
//     if (status.includes('❌')) return '#F44336';
//     if (status.includes('⏳')) return '#FFC107';
//     return '#757575';
//   };

//   return (
//     <View style={[styles.statusBar, {backgroundColor: 'rgba(0,0,0,0.05)'}]}>
//       <View style={[styles.statusDot, {backgroundColor: getStatusColor()}]} />
//       <Text style={styles.statusText}>{status}</Text>
//     </View>
//   );
// }

// function StudentListItem({item, isDarkMode}: {item: StudentRecord; isDarkMode: boolean}) {
//   return (
//     <View style={[styles.studentRecord, {backgroundColor: isDarkMode ? Colors.darker : Colors.lighter}]}>
//       <View style={styles.studentIdContainer}>
//         <Text style={[styles.studentId, {color: isDarkMode ? Colors.white : Colors.black}]}>
//           {item.id}
//         </Text>
//       </View>
//       <View style={styles.studentDetails}>
//         <Text style={[styles.studentIp, {color: isDarkMode ? Colors.light : Colors.dark}]}>
//           {item.ip}
//         </Text>
//         <Text style={[styles.studentTime, {color: isDarkMode ? Colors.light : Colors.dark}]}>
//           {item.timestamp}
//         </Text>
//       </View>
//     </View>
//   );
// }

// function App(): React.JSX.Element {
//   const isDarkMode = useColorScheme() === 'dark';
//   const [isLecturer, setIsLecturer] = useState<boolean>(false);
//   const [connectionStatus, setConnectionStatus] = useState<string>('');
//   const [socket, setSocket] = useState<any>(null);
//   const [ipAddress, setIpAddress] = useState<string>('');
//   const [presentStudents, setPresentStudents] = useState<StudentRecord[]>([]);
//   const [studentId] = useState<string>(`STU${Math.floor(Math.random() * 10000)}`);

//   const backgroundStyle = {
//     backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
//   };

//   useEffect(() => {
//     const getIpAddress = async () => {
//       try {
//         const ip = await NetworkInfo.getIPV4Address();
//         setIpAddress(ip || 'Unknown IP');
//       } catch (error) {
//         console.error('Error getting IP:', error);
//         Alert.alert('Error', 'Could not get device IP address');
//       }
//     };

//     getIpAddress();

//     if (isLecturer) {
//       setupLecturer();
//     } else {
//       setupStudent();
//     }

//     return () => {
//       if (socket) {
//         socket.close();
//       }
//     };
//   }, [isLecturer]);

//   const setupLecturer = () => {
//     const server = UdpSocket.createSocket('udp4');

//     server.on('message', (data: Buffer, rinfo: any) => {
//       try {
//         const studentData = JSON.parse(data.toString());
//         setPresentStudents(prev => {
//           if (!prev.find(student => student.id === studentData.id)) {
//             const newStudent = {
//               id: studentData.id,
//               ip: rinfo.address,
//               timestamp: new Date().toLocaleTimeString(),
//             };

//             server.send(
//               JSON.stringify({status: 'success'}),
//               undefined,
//               undefined,
//               rinfo.port,
//               rinfo.address,
//             );

//             return [...prev, newStudent];
//           }
//           return prev;
//         });
//       } catch (error) {
//         console.error('Error processing message:', error);
//       }
//     });

//     server.on('listening', () => {
//       setConnectionStatus(`Session active - Port ${server.address().port}`);
//     });

//     server.on('error', (err: Error) => {
//       console.error('Server error:', err);
//       Alert.alert('Error', 'Server encountered an error');
//     });

//     try {
//       server.bind(8888);
//       setSocket(server);
//     } catch (error) {
//       console.error('Binding error:', error);
//       Alert.alert('Error', 'Could not start attendance session');
//     }
//   };

//   const setupStudent = () => {
//     const client = UdpSocket.createSocket('udp4');

//     client.on('message', (data: Buffer) => {
//       try {
//         const response = JSON.parse(data.toString());
//         if (response.status === 'success') {
//           setConnectionStatus('✅ Attendance marked successfully!');
//         }
//       } catch (error) {
//         console.error('Error processing response:', error);
//       }
//     });

//     client.on('error', (err: Error) => {
//       console.error('Client error:', err);
//       Alert.alert('Error', 'Connection error occurred');
//     });

//     try {
//       client.bind(8887);
//       setSocket(client);
//     } catch (error) {
//       console.error('Client binding error:', error);
//       Alert.alert('Error', 'Could not connect to session');
//     }
//   };

//   const markAttendance = () => {
//     if (!socket || isLecturer) return;

//     const studentData = {
//       id: studentId,
//       timestamp: new Date().toISOString(),
//     };

//     try {
//       socket.send(
//         JSON.stringify(studentData),
//         undefined,
//         undefined,
//         8888,
//         '255.255.255.255',
//         (error: Error | null) => {
//           if (error) {
//             setConnectionStatus('❌ Failed to mark attendance');
//           } else {
//             setConnectionStatus('⏳ Marking attendance...');
//           }
//         },
//       );
//     } catch (error) {
//       console.error('Mark attendance error:', error);
//       Alert.alert('Error', 'Failed to mark attendance');
//     }
//   };

//   const renderContent = () => {
//     if (isLecturer) {
//       return (
//         <View style={styles.contentContainer}>
//           <Header
//             title="Attendance Monitor"
//             subtitle={`${presentStudents.length} students present`}
//           />
//           <StatusBadge status={connectionStatus || 'Waiting for students...'} />
//           <FlatList
//             data={presentStudents}
//             keyExtractor={item => item.id}
//             renderItem={({item}) => <StudentListItem item={item} isDarkMode={isDarkMode} />}
//             contentContainerStyle={styles.listContainer}
//             ItemSeparatorComponent={() => <View style={styles.separator} />}
//             showsVerticalScrollIndicator={false}
//           />
//         </View>
//       );
//     }

//     return (
//       <View style={styles.studentModeContainer}>
//         <Header title="Student Attendance" subtitle={`ID: ${studentId}`} />
//         <View style={styles.studentContent}>
//           <View style={styles.profileCard}>
//             <View style={styles.avatarContainer}>
//               <Text style={styles.avatarText}>{studentId.slice(3, 5)}</Text>
//             </View>
//             <Text style={[styles.profileId, {color: isDarkMode ? Colors.white : Colors.black}]}>
//               {studentId}
//             </Text>
//             <Text style={[styles.profileIp, {color: isDarkMode ? Colors.light : Colors.dark}]}>
//               {ipAddress}
//             </Text>
//           </View>
//           <StatusBadge status={connectionStatus || 'Ready to mark attendance'} />
//           <TouchableOpacity
//             style={[styles.markButton, {backgroundColor: Colors.primary}]}
//             onPress={markAttendance}>
//             <Text style={styles.markButtonText}>Mark Attendance</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={[styles.container, backgroundStyle]}>
//       <StatusBar
//         barStyle={isDarkMode ? 'light-content' : 'dark-content'}
//         backgroundColor={backgroundStyle.backgroundColor}
//       />
//       {renderContent()}
//       <TouchableOpacity
//         style={[styles.modeButton, {backgroundColor: Colors.primary}]}
//         onPress={() => setIsLecturer(!isLecturer)}>
//         <Text style={styles.modeButtonText}>
//           Switch to {isLecturer ? 'Student' : 'Lecturer'} Mode
//         </Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   headerContainer: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(0,0,0,0.1)',
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     marginTop: 4,
//     opacity: 0.7,
//   },
//   contentContainer: {
//     flex: 1,
//   },
//   statusBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     marginHorizontal: 20,
//     marginVertical: 10,
//     borderRadius: 8,
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 8,
//   },
//   statusText: {
//     fontSize: 14,
//     textAlign: 'center',
//   },
//   listContainer: {
//     padding: 20,
//   },
//   studentRecord: {
//     flexDirection: 'row',
//     padding: 16,
//     borderRadius: 12,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: {width: 0, height: 2},
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   studentIdContainer: {
//     backgroundColor: 'rgba(0,0,0,0.05)',
//     padding: 8,
//     borderRadius: 8,
//     marginRight: 12,
//   },
//   studentId: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   studentDetails: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   studentIp: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   studentTime: {
//     fontSize: 12,
//     opacity: 0.7,
//   },
//   separator: {
//     height: 12,
//   },
//   studentModeContainer: {
//     flex: 1,
//   },
//   studentContent: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   profileCard: {
//     backgroundColor: 'rgba(0,0,0,0.05)',
//     padding: 24,
//     borderRadius: 16,
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   avatarContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: Colors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   avatarText: {
//     color: '#FFFFFF',
//     fontSize: 24,
//     fontWeight: '700',
//   },
//   profileId: {
//     fontSize: 20,
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   profileIp: {
//     fontSize: 14,
//     opacity: 0.7,
//   },
//   markButton: {
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginVertical: 20,
//     ...Platform.select({
//       ios: {
//         shadowColor: Colors.primary,
//         shadowOffset: {width: 0, height: 4},
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   markButtonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   modeButton: {
//     margin: 20,
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   modeButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// Colors.primary = '#007AFF';

// export default App;




// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LecturerScreen } from './screens/lec';
import { StudentScreen } from './screens/stud';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createNativeStackNavigator();

const THEME = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
};

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: THEME.dark,
            },
            headerTintColor: THEME.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
          }}>
          <Stack.Screen
            name="Student"
            component={StudentScreen}
            options={({ navigation }) => ({
              title: 'Student Attendance',
              headerRight: () => (
                <TouchableOpacity 
                  style={styles.headerButton}
                  hitSlop={20}
                  onPress={() => navigation.navigate('Lecturer')}>
                  <Icon name="account-tie" size={20} color={THEME.accent} />
                  <Text style={styles.headerButtonText}>Lecturer Mode</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="Lecturer"
            component={LecturerScreen}
            options={({ navigation }) => ({
              title: 'Attendance Monitor',
              headerLeft: () => (
                <TouchableOpacity 
                  style={[styles.headerButton, {marginRight: 50}]}
                  onPress={() => navigation.goBack()}>
                  <Icon name="account" size={20} color={THEME.accent} />
                  <Text style={styles.headerButtonText}>Student Mode</Text>
                </TouchableOpacity>
              ),
            })}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: `${THEME.accent}15`,
  },
  headerButtonText: {
    color: THEME.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default App;