import * as SQLite from 'expo-sqlite';

let db;

export const initDB = async () => {
  db = await SQLite.openDatabaseAsync('educheck.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      admission_no TEXT NOT NULL,

      
      course TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance (
      attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );
  `);
};

export const addStudent = async (name, admissionNo, course) => {
  await db.runAsync(
    'INSERT INTO students (name, admission_no, course) VALUES (?, ?, ?);',
    [name, admissionNo, course]
  );
};

export const getStudents = async () => {
  return await db.getAllAsync('SELECT * FROM students;');
};
export const markAttendance = async (studentId, date, status) => {
  await db.runAsync(
    'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?);',
    [studentId, date, status]
  );
};

export const getAttendanceByDate = async (date) => {
  return await db.getAllAsync(
    'SELECT attendance.*, students.name FROM attendance JOIN students ON attendance.student_id = students.id WHERE date = ?;',
    [date]
  );
};