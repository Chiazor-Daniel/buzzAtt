import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { SCREEN_NAMES } from '../navigation/config';
import { useAuthHandler } from '../custom-hooks/useAuthHandler';

type RootStackParamList = {
  [SCREEN_NAMES.LOGIN]: undefined;
  [SCREEN_NAMES.REGISTER]: undefined;
  [SCREEN_NAMES.MAIN_TABS]: undefined;
  ZeroconfTest: undefined;
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, typeof SCREEN_NAMES.LOGIN>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const navigateToMainTabs = (fromLogin: boolean = false) => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: SCREEN_NAMES.MAIN_TABS,
        ...(fromLogin && { params: { fromLogin: true } }) 
      }],
    });
  };

  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    handleQuickUse,
  } = useAuthHandler(
    () => navigateToMainTabs(true),
    () => navigateToMainTabs(false)
  );

  React.useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error);
    }
  }, [error]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back! Please sign in to continue.</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={THEME.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={THEME.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={THEME.text} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleQuickUse}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Quick Use</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate(SCREEN_NAMES.REGISTER)}
        >
          <Text style={styles.registerButtonText}>Don't have an account? <Text style={styles.registerLink}>Register</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl * 2,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: THEME.textSecondary,
    fontFamily: FONTS.regular,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: THEME.accent,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  secondaryButton: {
    backgroundColor: THEME.card,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerButtonText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  registerLink: {
    color: THEME.accent,
    fontFamily: FONTS.bold,
  },
});

export default LoginScreen;