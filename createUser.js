import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load konfigurasi dari file .env
dotenv.config();

// Konfigurasi koneksi database
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

// Fungsi untuk menambahkan user dengan password yang di-hash
async function insertUser(username, password, role) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    const query = "INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, NOW())";
    await connection.execute(query, [username, hashedPassword, role]);

    console.log(`User "${username}" berhasil ditambahkan dengan password ter-hash!`);
    await connection.end();
  } catch (error) {
    console.error("Error inserting user:", error);
  }
}

// **GANTI DATA USER DI SINI**
insertUser("SuperAdmin", "superadmin123", "super_admin");
insertUser("Admin", "admin123", "admin");
