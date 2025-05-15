import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
} from 'react-native';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { THEME, SPACING, FONTS, FONT_SIZES } from '../theme';
import { useLecturerSession } from '../custom-hooks/useLecturerSession';
import { SessionControlCard } from '../components/SessionControlCard';

type Student = {
  matricNumber: string;
  ip: string;
  timestamp: number;
};

export function LecturerScreen({ route }: { route: any }) {
  const {
    isSessionActive,
    students,
    isLoadingSession,
    elapsedTime,
    startSession,
    stopSession,
    clearStudents,
  } = useLecturerSession();

  const courseId = route.params?.courseId;
  const courseTitle = route.params?.courseTitle;

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleClearStudentList = () => {
    Alert.alert(
      'Clear Student List',
      'Are you sure you want to clear the list of present students?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearStudents(),
        },
      ]
    );
  };

  const exportToCSV = async () => {
    if (students.length === 0) {
      Toast.show({ type: 'info', text1: 'No Data', text2: 'There are no students to export' });
      return;
    }
    setIsExporting(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Storage permission is required' });
          setIsExporting(false);
          return;
        }
      }
      const headers = 'Matric Number,Time,IP Address\n';
      const rows = students.map(student => {
        const time = new Date(student.timestamp).toLocaleString();
        return `${student.matricNumber},${time},${student.ip}`;
      }).join('\n');
      const csvContent = headers + rows;
      const date = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `attendance_${courseTitle || 'session'}_${date}_${time}.csv`;
      const path = Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.writeFile(path, csvContent, 'utf8');
      Toast.show({
        type: 'success',
        text1: 'Export Successful',
        text2: `Saved to ${Platform.OS === 'ios' ? 'Documents' : 'Downloads'}/${fileName}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Toast.show({ type: 'error', text1: 'Export Failed', text2: 'Could not export attendance data' });
    } finally {
      setIsExporting(false);
    }
  };

  const renderStudent = ({ item }: { item: Student }) => {
    const isRecent = Date.now() - item.timestamp < 5000;
    return (
      <View style={[styles.studentCard, isRecent && styles.studentCardHighlight]}>
        <View style={styles.studentInfo}>
          <Text style={styles.matricNumber}>{item.matricNumber}</Text>
          <Text style={styles.ipAddress}>{item.ip}</Text>
        </View>
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          {isRecent && (
            <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.darker} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.screenTitle}>Lecturer Attendance - {courseTitle || 'Session'}</Text>

        <SessionControlCard
          isActive={isSessionActive}
          isLoading={isLoadingSession}
          elapsedTime={elapsedTime}
          onStartSession={startSession}
          onStopSession={stopSession}
        />

        <View style={styles.studentsContainer}>
          <View style={styles.studentListHeader}>
            <View style={styles.studentCountContainer}>
              <Text style={styles.studentsTitle}>Present Students</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{students.length}</Text></View>
            </View>
            <View style={styles.listActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleClearStudentList}
                disabled={students.length === 0}
              >
                <Icon name="delete-outline" size={22} color={THEME.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={exportToCSV}
                disabled={isExporting || students.length === 0}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={THEME.accent} />
                ) : (
                  <Icon name="export-variant" size={22} color={THEME.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="account-question" size={48} color={THEME.textSecondary} />
              <Text style={styles.emptyStateText}>No students have marked attendance yet</Text>
            </View>
          ) : (
            <FlatList
              data={students}
              renderItem={renderStudent}
              keyExtractor={(item) => item.matricNumber}
              contentContainerStyle={styles.studentsList}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.darker,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  screenTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.lg,
  },
  studentsContainer: {
    marginTop: SPACING.lg,
    minHeight: 300,
  },
  studentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  studentCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentsTitle: {
    color: THEME.text,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginRight: SPACING.sm,
  },
  countBadge: {
    backgroundColor: THEME.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: THEME.text,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  listActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  studentsList: {
    paddingBottom: SPACING.md,
  },
  studentCard: {
    backgroundColor: THEME.card,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentCardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.accent,
    backgroundColor: THEME.card + 'F5', // Slightly lighter
  },
  studentInfo: {
    flex: 1,
  },
  matricNumber: {
    color: THEME.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  ipAddress: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  newBadge: {
    backgroundColor: THEME.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  newBadgeText: {
    color: THEME.text,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    color: THEME.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});