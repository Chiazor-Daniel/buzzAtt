import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Header } from '../components/utils';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { PinInputModal } from '../components/PinInputModal';
import { useAttendanceAuth } from '../custom-hooks/useAttendanceAuth';
import { useStudentAttendance } from '../custom-hooks/useStudentAttendance';

export function StudentScreen({ route }: { route: any }) {
  const { className } = route.params || {};

  const {
    matricNumber,
    setMatricNumber,
    isMarking,
    isSuccess,
    setIsSuccess,
    lastMarkedTime,
    submitAttendance,
  } = useStudentAttendance();

  const {
    biometricAvailable,
    biometricType,
    showPinModal,
    pin,
    pinError,
    setPin,
    requestAuthentication,
    verifyPin,
    closePinModal,
  } = useAttendanceAuth(submitAttendance);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSuccess) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setIsSuccess(false));
    }
  }, [isSuccess, fadeAnim, setIsSuccess]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };
  
  const handleMarkAttendance = () => {
    animateButton();
    requestAuthentication(matricNumber.trim() !== '');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <Header title={`Student Attendance - ${className || 'Class'}`} />
      <View style={styles.content}>
        <Animated.View style={[styles.successNotification, { opacity: fadeAnim }]} pointerEvents="none">
          <View style={styles.successContent}>
            <Icon name="check-circle-outline" size={24} color="#fff" />
            <Text style={styles.successText}>Attendance Sent!</Text>
          </View>
        </Animated.View>
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Matric Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input} 
                placeholder="Enter your matric number" 
                placeholderTextColor={THEME.textSecondary} 
                value={matricNumber}
                onChangeText={setMatricNumber}
                autoCapitalize="characters" 
              />
              {matricNumber.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={() => setMatricNumber('')}> 
                  <Icon name="close-circle" size={20} color={THEME.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={[styles.button, isMarking && styles.buttonDisabled]} 
              onPress={handleMarkAttendance}
              disabled={isMarking}
            >
              {isMarking ? (
                <ActivityIndicator size="small" color={THEME.text} />
              ) : (
                <View style={styles.buttonContent}>
                  <Icon name={biometricAvailable ? "fingerprint" : "check-circle"} size={24} color={THEME.text} />
                  <Text style={styles.buttonText}>{`Mark with ${biometricAvailable ? biometricType : 'PIN'}`}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <PinInputModal
          visible={showPinModal}
          onClose={closePinModal}
          pin={pin}
          onPinChange={setPin}
          onSubmit={verifyPin}
          error={pinError}
          isSubmitDisabled={pin.length < 4}
        />

        <View style={styles.networkInfoContainer}>
          <Text style={styles.networkInfoTitle}>Connection Information</Text>
          <View style={styles.networkInfoSection}>
            <Icon name="wifi" size={24} color={THEME.accent} style={styles.networkIcon} />
            <Text style={styles.networkInfoText}>Make sure you're on the same WiFi network as your lecturer</Text>
          </View>
          {lastMarkedTime && (
            <View style={styles.lastMarkedContainer}>
              <Icon name="clock-check-outline" size={20} color={THEME.accent} style={styles.networkIcon} />
              <Text style={styles.lastMarkedText}>Last marked: {lastMarkedTime}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.darker },
  content: { flex: 1, padding: SPACING.lg },
  card: { backgroundColor: THEME.card, borderRadius: 12, padding: SPACING.lg, marginBottom: SPACING.lg, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  inputContainer: { marginBottom: SPACING.xl },
  label: { color: THEME.text, fontSize: FONT_SIZES.md, marginBottom: SPACING.sm, fontFamily: FONTS.medium },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.darker, borderRadius: 8, borderWidth: 1, borderColor: THEME.accent + '40' },
  input: { flex: 1, color: THEME.text, padding: SPACING.md, fontSize: FONT_SIZES.md, fontFamily: FONTS.regular },
  clearButton: { padding: SPACING.sm },
  button: { backgroundColor: THEME.accent, padding: SPACING.md, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: THEME.text, fontSize: FONT_SIZES.md, marginLeft: SPACING.sm, fontFamily: FONTS.medium },
  networkInfoContainer: { flex: 1, marginTop: SPACING.lg, },
  networkInfoTitle: { color: THEME.text, fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold, marginBottom: SPACING.md, },
  networkInfoSection: { flexDirection: 'row', alignItems: 'flex-start', },
  networkIcon: { marginRight: SPACING.md, marginTop: 2, },
  networkInfoText: { color: THEME.textSecondary, fontSize: FONT_SIZES.md, fontFamily: FONTS.regular, flex: 1, lineHeight: 22, },
  lastMarkedContainer: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: THEME.darker, },
  lastMarkedText: { color: THEME.textSecondary, fontSize: FONT_SIZES.md, fontFamily: FONTS.medium, marginLeft: SPACING.sm, },
  successNotification: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: THEME.success || '#4CAF50', zIndex: 10, padding: SPACING.md, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, },
  successContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', },
  successText: { color: '#FFFFFF', fontSize: FONT_SIZES.md, fontFamily: FONTS.bold, marginLeft: SPACING.sm, },
});