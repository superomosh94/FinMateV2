const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || (isProduction ? '' : 'localhost'),
  user: process.env.DB_USER || (isProduction ? '' : 'root'),
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || (isProduction ? '' : 'finmate_local'),
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: isProduction
    ? {
        // Use Aiven CA certificate if available
        ca: fs.existsSync(process.env.DB_CA_PATH)
          ? fs.readFileSync(process.env.DB_CA_PATH).toString()
          : undefined,
        // fallback for self-signed certs
        rejectUnauthorized: fs.existsSync(process.env.DB_CA_PATH)
          ? true
          : false
      }
    : false
};

// Log which environment is active
console.log(`🔧 Database Configuration: ${isProduction ? 'Production (Aiven Cloud)' : 'Development (Local)'}`);
console.log(`📊 Database: ${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

// Query helper
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Execute helper
const execute = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Database execute error:', error.message);
    throw error;
  }
};

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    console.log('📦 Initializing database tables...');

    if (!isProduction) {
      try {
        await execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        console.log(`✅ Database ${dbConfig.database} ready`);
      } catch {
        console.log('ℹ️ Database already exists or creation not needed');
      }
    }

    // === Tables Creation Section ===
    await execute(`CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS role_permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
      UNIQUE KEY unique_role_permission (role_id, permission_id)
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      role_id INT NOT NULL,
      team_id INT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      team_leader_id INT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (team_leader_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS savings_goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      target_amount DECIMAL(10,2) NOT NULL,
      current_amount DECIMAL(10,2) DEFAULT 0,
      target_date DATE,
      status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      period ENUM('monthly','weekly','yearly','custom') DEFAULT 'monthly',
      status ENUM('active','inactive','completed') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS planned_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      due_date DATE NOT NULL,
      status ENUM('pending','paid','cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    await execute(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info','warning','success','error') DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // === Default Data Section ===
    await execute(`INSERT IGNORE INTO roles (id,name,description) VALUES
      (1,'super_admin','Full system access'),
      (2,'admin','Administrative access'),
      (3,'team_leader','Team management access'),
      (4,'team_member','Team member access'),
      (5,'individual_user','Individual user access')`);

    await execute(`INSERT IGNORE INTO permissions (id,name,description) VALUES
      (1,'user_manage','Manage users'),
      (2,'team_manage','Manage teams'),
      (3,'budget_manage','Manage budgets'),
      (4,'expense_manage','Manage expenses'),
      (5,'savings_manage','Manage savings'),
      (6,'report_view','View reports'),
      (7,'system_manage','Manage system settings')`);

    await execute(`INSERT IGNORE INTO role_permissions (role_id,permission_id) VALUES
      (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),
      (2,1),(2,2),(2,3),(2,4),(2,5),(2,6),
      (3,2),(3,3),(3,4),(3,5),(3,6),
      (4,4),(4,5),(4,6),
      (5,3),(5,4),(5,5),(5,6)`);

    console.log('✅ Database tables initialized successfully');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  execute,
  getConnection: () => pool.getConnection(),
  testConnection,
  initDatabase
};
