// Register.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function Register() {
  const navigation = useNavigation();
  const route = useRoute();
  const slideAnim = React.useRef(new Animated.Value(100)).current;
  const { userType } = route.params || { userType: 'student' };

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 20,
      friction: 7,
    }).start();
  }, []);

  return (
    <ScrollView style={styles.scrollView}>
      <Animated.View 
        style={[
          styles.container, 
          { transform: [{ translateY: slideAnim }] }
        ]}>
        <Text style={styles.title}>{userType === 'lecturer' ? 'Lecturer Registration' : 'Student Registration'}</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
          {userType === 'student' && (
            <TextInput
              style={styles.input}
              placeholder="Student ID"
              placeholderTextColor="#999"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Attendance')}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.loginText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 20,
    minHeight: 800,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 30,
    marginTop: 40,
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
  registerButton: {
    backgroundColor: '#6B46C1',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  registerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 20,
  },
  loginText: {
    color: '#6B46C1',
    textAlign: 'center',
    fontSize: 16,
  },
});