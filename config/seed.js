require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
const { ROLES, PERMISSIONS } = require('./appConfig');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Insert roles
    const roles = [
      { name: ROLES.SUPER_ADMIN, description: 'Full system access' },
      { name: ROLES.ADMIN, description: 'Administrative access' },
      { name: ROLES.TEAM_LEADER, description: 'Team leader access' },
      { name: ROLES.TEAM_MEMBER, description: 'Team member access' },
      { name: ROLES.INDIVIDUAL_USER, description: 'Individual user access' }
    ];

    for (const role of roles) {
      await db.pool.execute(
        'INSERT IGNORE INTO roles (name, description) VALUES (?, ?)',
        [role.name, role.description]
      );
    }
    console.log('✅ Roles seeded');

    // Insert permissions
    const permissions = Object.values(PERMISSIONS).map(permission => ({
      name: permission,
      description: `Permission to ${permission}`
    }));

    for (const permission of permissions) {
      await db.pool.execute(
        'INSERT IGNORE INTO permissions (name, description) VALUES (?, ?)',
        [permission.name, permission.description]
      );
    }
    console.log('✅ Permissions seeded');

    // Get role IDs
    const [roleRows] = await db.pool.execute('SELECT id, name FROM roles');
    const roleMap = {};
    roleRows.forEach(role => {
      roleMap[role.name] = role.id;
    });

    // Get permission IDs
    const [permissionRows] = await db.pool.execute('SELECT id, name FROM permissions');
    const permissionMap = {};
    permissionRows.forEach(permission => {
      permissionMap[permission.name] = permission.id;
    });

    // Assign permissions to roles
    const rolePermissions = {
      [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
      [ROLES.ADMIN]: [
        PERMISSIONS.MANAGE_TEAM_USERS,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.VIEW_ROLES,
        PERMISSIONS.VIEW_PERMISSIONS,
        PERMISSIONS.MANAGE_ALL_EXPENSES,
        PERMISSIONS.VIEW_EXPENSES,
        PERMISSIONS.MANAGE_ALL_BUDGETS,
        PERMISSIONS.VIEW_BUDGETS,
        PERMISSIONS.MANAGE_TEAMS,
        PERMISSIONS.VIEW_TEAMS,
        PERMISSIONS.MANAGE_NOTIFICATIONS,
        PERMISSIONS.VIEW_NOTIFICATIONS
      ],
      [ROLES.TEAM_LEADER]: [
        PERMISSIONS.MANAGE_TEAM_USERS,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.MANAGE_TEAM_EXPENSES,
        PERMISSIONS.VIEW_EXPENSES,
        PERMISSIONS.MANAGE_TEAM_BUDGETS,
        PERMISSIONS.VIEW_BUDGETS,
        PERMISSIONS.VIEW_TEAMS,
        PERMISSIONS.MANAGE_OWN_EXPENSES,
        PERMISSIONS.MANAGE_OWN_BUDGETS,
        PERMISSIONS.VIEW_NOTIFICATIONS
      ],
      [ROLES.TEAM_MEMBER]: [
        PERMISSIONS.MANAGE_OWN_EXPENSES,
        PERMISSIONS.VIEW_EXPENSES,
        PERMISSIONS.MANAGE_OWN_BUDGETS,
        PERMISSIONS.VIEW_BUDGETS,
        PERMISSIONS.VIEW_TEAMS,
        PERMISSIONS.VIEW_NOTIFICATIONS
      ],
      [ROLES.INDIVIDUAL_USER]: [
        PERMISSIONS.MANAGE_OWN_EXPENSES,
        PERMISSIONS.VIEW_EXPENSES,
        PERMISSIONS.MANAGE_OWN_BUDGETS,
        PERMISSIONS.VIEW_BUDGETS,
        PERMISSIONS.MANAGE_SAVINGS,
        PERMISSIONS.VIEW_SAVINGS,
        PERMISSIONS.VIEW_NOTIFICATIONS
      ]
    };

    for (const [roleName, perms] of Object.entries(rolePermissions)) {
      const roleId = roleMap[roleName];
      for (const permName of perms) {
        const permissionId = permissionMap[permName];
        await db.pool.execute(
          'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permissionId]
        );
      }
    }
    console.log('✅ Role permissions seeded');

    // Create teams
    const [teamResult] = await db.pool.execute(
      'INSERT IGNORE INTO teams (name, description) VALUES (?, ?)',
      ['Development Team', 'Software development team']
    );
    const teamId = teamResult.insertId;

    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await db.pool.execute(
      `INSERT IGNORE INTO users (username, email, password, first_name, last_name, role_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['superadmin', 'superadmin@finmate.com', hashedPassword, 'Super', 'Admin', roleMap[ROLES.SUPER_ADMIN]]
    );

    // Create sample admin user
    await db.pool.execute(
      `INSERT IGNORE INTO users (username, email, password, first_name, last_name, role_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin', 'admin@finmate.com', hashedPassword, 'System', 'Admin', roleMap[ROLES.ADMIN]]
    );

    // Create sample team leader
    await db.pool.execute(
      `INSERT IGNORE INTO users (username, email, password, first_name, last_name, role_id, team_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['teamlead', 'teamlead@finmate.com', hashedPassword, 'Sarah', 'Johnson', roleMap[ROLES.TEAM_LEADER], teamId]
    );

    // Create sample team member
    await db.pool.execute(
      `INSERT IGNORE INTO users (username, email, password, first_name, last_name, role_id, team_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['teammember', 'teammember@finmate.com', hashedPassword, 'Mike', 'Chen', roleMap[ROLES.TEAM_MEMBER], teamId]
    );

    // Create sample individual user
    await db.pool.execute(
      `INSERT IGNORE INTO users (username, email, password, first_name, last_name, role_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['user1', 'user1@finmate.com', hashedPassword, 'John', 'Doe', roleMap[ROLES.INDIVIDUAL_USER]]
    );

    // Update team with leader
    await db.pool.execute(
      'UPDATE teams SET team_leader_id = ? WHERE id = ?',
      [3, teamId] // Assuming team leader has ID 3
    );

    // Create sample expenses
    await db.pool.execute(
      `INSERT IGNORE INTO expenses (user_id, team_id, amount, description, category, date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [5, null, 150.75, 'Grocery shopping', 'Food & Dining', '2024-01-15', 'approved']
    );

    await db.pool.execute(
      `INSERT IGNORE INTO expenses (user_id, team_id, amount, description, category, date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [3, teamId, 200.00, 'Team lunch', 'Food & Dining', '2024-01-16', 'pending']
    );

    // Create sample budgets
    await db.pool.execute(
      `INSERT IGNORE INTO budgets (user_id, category, amount, period, start_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [5, 'Food & Dining', 500.00, 'monthly', '2024-01-01']
    );

    // Create sample savings goal
    await db.pool.execute(
      `INSERT IGNORE INTO savings (user_id, goal_name, target_amount, current_amount, target_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [5, 'New Laptop', 1200.00, 300.00, '2024-06-01']
    );

    console.log('✅ Sample data seeded');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📋 Sample login credentials:');
    console.log('   Super Admin: superadmin / admin123');
    console.log('   Admin: admin / admin123');
    console.log('   Team Leader: teamlead / admin123');
    console.log('   Team Member: teammember / admin123');
    console.log('   Individual User: user1 / admin123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit();
  }
};

// Initialize database and run seeding
db.initDatabase().then(() => {
  seedDatabase();
});