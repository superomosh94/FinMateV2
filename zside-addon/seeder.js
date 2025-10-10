require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const seedDatabase = async () => {
  let connection;
  try {
    console.log('🌱 Starting database seeding...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    // Insert roles
    const roles = [
      { name: 'super_admin', description: 'Full system access' },
      { name: 'admin', description: 'Administrative access' },
      { name: 'team_leader', description: 'Team leader access' },
      { name: 'team_member', description: 'Team member access' },
      { name: 'individual_user', description: 'Individual user access' }
    ];

    console.log('📝 Seeding roles...');
    for (const role of roles) {
      await connection.execute(
        'INSERT IGNORE INTO roles (name, description) VALUES (?, ?)',
        [role.name, role.description]
      );
      console.log(`   ✅ Role: ${role.name}`);
    }

    // Create users
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    console.log('👥 Seeding users...');
    const users = [
      { username: 'superadmin', email: 'superadmin@finmate.com', password: hashedPassword, first_name: 'Super', last_name: 'Admin', role_name: 'super_admin' },
      { username: 'admin', email: 'admin@finmate.com', password: hashedPassword, first_name: 'System', last_name: 'Admin', role_name: 'admin' },
      { username: 'user1', email: 'user1@finmate.com', password: hashedPassword, first_name: 'John', last_name: 'Doe', role_name: 'individual_user' }
    ];

    for (const user of users) {
      // Get role ID for this user
      const [roleResult] = await connection.execute('SELECT id FROM roles WHERE name = ?', [user.role_name]);
      const roleId = roleResult[0].id;

      await connection.execute(
        `INSERT IGNORE INTO users (username, email, password, first_name, last_name, role_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.username, user.email, user.password, user.first_name, user.last_name, roleId]
      );
      console.log(`   ✅ User: ${user.username} (${user.role_name})`);
    }

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Sample login credentials:');
    console.log('   Super Admin: superadmin@finmate.com / admin123');
    console.log('   Admin: admin@finmate.com / admin123');
    console.log('   User: user1@finmate.com / admin123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
};

seedDatabase();