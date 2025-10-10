require('dotenv').config();
const mysql = require('mysql2/promise');

const checkData = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('🔍 Checking database data...');
    
    // Check if tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME}'
    `);
    console.log('📊 Tables in database:', tables.map(t => t.TABLE_NAME));
    
    // Check roles
    const [roles] = await connection.execute('SELECT * FROM roles');
    console.log('👑 Roles:', roles);
    
    // Check users with role names
    const [users] = await connection.execute(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id
    `);
    console.log('👥 Users:', users);
    
    // Check table structures
    console.log('📋 Checking table structures:');
    const tablesToCheck = ['roles', 'users', 'permissions', 'role_permissions', 'teams'];
    
    for (const tableName of tablesToCheck) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log(`   ${tableName}:`, columns.map(col => col.Field));
      } catch (error) {
        console.log(`   ${tableName}: Table doesn't exist or error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
};

checkData();