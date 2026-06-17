import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { addStudent } from '../database/db';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [course, setCourse] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !admissionNo.trim() || !course.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addStudent(name, admissionNo, course);
      Alert.alert('Success', 'Student registered successfully');
      setName('');
      setAdmissionNo('');
      setCourse('');
    } catch (error) {
      Alert.alert('Error', 'Failed to register student: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Registration</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Admission Number"
        value={admissionNo}
        onChangeText={setAdmissionNo}
      />

      <TextInput
        style={styles.input}
        placeholder="Course"
        value={course}
        onChangeText={setCourse}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register Student</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.viewButton]}
        onPress={() => navigation.navigate('Reports')}
      >
        <Text style={styles.buttonText}>View Registered Students</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  viewButton: { backgroundColor: '#16a34a' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
