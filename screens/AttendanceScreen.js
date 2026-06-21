import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getStudents, markAttendance } from '../database/db';

export default function AttendanceScreen() {
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const data = await getStudents();
    setStudents(data);
  };

  const toggleStatus = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      for (const student of students) {
        const status = attendanceMap[student.id] || 'absent';
        await markAttendance(student.id, today, status);
      }

      Alert.alert('Success', 'Attendance recorded for ' + today);
      setAttendanceMap({});
    } catch (error) {
      console.log('Attendance submit error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const renderItem = ({ item }) => {
    const status = attendanceMap[item.id];
    return (
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, status === 'present' && styles.presentActive]}
            onPress={() => toggleStatus(item.id, 'present')}
          >
            <Text style={styles.btnText}>Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, status === 'absent' && styles.absentActive]}
            onPress={() => toggleStatus(item.id, 'absent')}
          >
            <Text style={styles.btnText}>Absent</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mark Attendance</Text>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      <TouchableOpacity style={styles.submitBtn} onPress={submitAttendance}>
        <Text style={styles.submitText}>Submit Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 16 },
  buttons: { flexDirection: 'row' },
  btn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#ddd', marginLeft: 8 },
  presentActive: { backgroundColor: '#4CAF50' },
  absentActive: { backgroundColor: '#F44336' },
  btnText: { color: '#fff', fontWeight: '600' },
  submitBtn: { marginTop: 16, backgroundColor: '#2196F3', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});