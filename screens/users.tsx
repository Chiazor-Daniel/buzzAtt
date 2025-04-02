// UserType.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function UserType() {
  const navigation = useNavigation();
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 10,
      friction: 2,
    }).start();
  }, []);

  const animatePress = (type: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.navigate('Login', { userType: type }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Attendance+</Text>
      <Text style={styles.subtitle}>Choose your role to continue</Text>
      
      <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity 
          style={[styles.button, styles.lecturerButton]}
          onPress={() => animatePress('lecturer')}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Lecturer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.studentButton]}
          onPress={() => animatePress('student')}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Student</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lecturerButton: {
    borderColor: '#6B46C1',
    borderWidth: 2,
  },
  studentButton: {
    borderColor: '#9F7AEA',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B46C1',
    marginLeft: 15,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
