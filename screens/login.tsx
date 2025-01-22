// Login.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function Login() {
  const navigation = useNavigation();
  const route = useRoute();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const { userType } = route.params || { userType: 'student' };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>{userType === 'lecturer' ? 'Lecturer Login' : 'Student Login'}</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => navigation.navigate('Attendance')}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.registerButton}
        onPress={() => navigation.navigate('Register', { userType })}>
        <Text style={styles.registerText}>Don't have an account? Register</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.anonymousButton}
        onPress={() => navigation.navigate('Attendance')}>
        <Text style={styles.anonymousText}>Continue Anonymously</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loginButton: {
    backgroundColor: '#6B46C1',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: 20,
  },
  registerText: {
    color: '#6B46C1',
    textAlign: 'center',
    fontSize: 16,
  },
  anonymousButton: {
    marginTop: 15,
  },
  anonymousText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
});
