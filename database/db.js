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
}