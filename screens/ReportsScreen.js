import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStudents } from '../database/db';

export default function ReportsScreen() {
  const [students, setStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudents = async () => {
    const data = await getStudents();
    setStudents(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registered Students</Text>

      {students.length === 0 ? (
        <Text style={styles.empty}>No students registered yet.</Text>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>Admission No: {item.admission_no}</Text>
              <Text style={styles.detail}>Course: {item.course}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#888', marginTop: 50 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  detail: { fontSize: 14, color: '#555' },
});