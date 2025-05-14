import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Icon } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { THEME, SPACING, FONT_SIZES, FONTS } from '../theme';

const LecturerScreen = ({ route }) => {
  const navigation = useNavigation();
  const { courseName } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.courseTitle}>{courseName || 'Attendance'}</Text>
      </View>

      <View style={styles.content}>
        {/* Add your attendance taking UI here */}
        <Text style={styles.subtitle}>Take Attendance</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  courseTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginLeft: SPACING.md,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.md,
  },
});

export default LecturerScreen;
