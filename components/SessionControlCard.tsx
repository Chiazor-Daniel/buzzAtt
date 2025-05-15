import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';

interface SessionControlCardProps {
  isActive: boolean;
  isLoading: boolean;
  elapsedTime: string;
  onStartSession: () => void;
  onStopSession: () => void;
}

export const SessionControlCard: React.FC<SessionControlCardProps> = ({
  isActive,
  isLoading,
  elapsedTime,
  onStartSession,
  onStopSession,
}) => {
  if (!isActive) {
    return (
      <TouchableOpacity
        style={styles.sessionInfoCard}
        onPress={onStartSession}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={THEME.accent} />
        ) : (
          <View style={styles.startSessionContent}>
            <View style={styles.playIconContainer}>
              <Icon name="play" size={32} color={THEME.accent} />
            </View>
            <Text style={styles.startListeningText}>Start Listening</Text>
            <Text style={styles.startListeningSubtext}>Tap to begin attendance session</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.sessionInfoCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>Session Active - {elapsedTime}</Text>
        </View>
        <TouchableOpacity style={styles.stopButton} onPress={onStopSession}>
          <Icon name="stop-circle" size={24} color={THEME.text} />
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sessionInfoCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: THEME.accent,
    minHeight: 150,
    justifyContent: 'center',
  },
  startSessionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.accent + '33', // Approx 0.2 opacity for accent color
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  startListeningText: {
    color: THEME.accent,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  startListeningSubtext: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
    backgroundColor: THEME.success || '#4CAF50', // Use theme success or fallback
  },
  statusText: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)', // Fallback to hardcoded RGBA
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  buttonText: {
    color: THEME.text, // Or THEME.danger if text itself should be colored
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
    fontFamily: FONTS.medium,
  },
}); 