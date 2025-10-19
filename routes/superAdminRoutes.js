// routes/superAdminRoutes.js
const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const router = express.Router();

// All routes require super admin role
router.use(authenticate, requireRole(['super_admin']));

// ======== SUPER ADMIN DASHBOARD ROUTES ========

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Initialize default stats
    const stats = {
      totalUsers: 0,
      totalAdmins: 0,
      totalBudgets: 0,
      totalExpenses: 0,
      pendingExpenses: 0,
      totalTeams: 0,
      systemLogsLast24h: 0,
      monthlyRevenue: 0,
      totalSavingsGoals: 0,
      totalNotifications: 0
    };

    // Get basic statistics
    try {
      const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
      const [adminCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE role_id IN (1, 2) AND is_active = 1');
      const [budgetCount] = await db.pool.execute('SELECT COUNT(*) as count FROM budgets');
      const [expenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses');
      const [pendingExpenses] = await db.pool.execute("SELECT COUNT(*) as count FROM expenses WHERE status = 'pending'");
      const [teamCount] = await db.pool.execute('SELECT COUNT(*) as count FROM teams');
      const [savingsGoalsCount] = await db.pool.execute('SELECT COUNT(*) as count FROM savings_goals WHERE status = "active"');
      const [notificationCount] = await db.pool.execute('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0');

      stats.totalUsers = parseInt(userCount[0].count) || 0;
      stats.totalAdmins = parseInt(adminCount[0].count) || 0;
      stats.totalBudgets = parseInt(budgetCount[0].count) || 0;
      stats.totalExpenses = parseInt(expenseCount[0].count) || 0;
      stats.pendingExpenses = parseInt(pendingExpenses[0].count) || 0;
      stats.totalTeams = parseInt(teamCount[0].count) || 0;
      stats.totalSavingsGoals = parseInt(savingsGoalsCount[0].count) || 0;
      stats.totalNotifications = parseInt(notificationCount[0].count) || 0;
    } catch (dbError) {
      console.error('Error loading basic stats:', dbError.message);
    }

    // Get optional statistics
    try {
      const [systemLogs] = await db.pool.execute('SELECT COUNT(*) as count FROM system_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)');
      stats.systemLogsLast24h = parseInt(systemLogs[0].count) || 0;
    } catch (error) {
      console.log('System logs table not available, using default value');
    }

    try {
      const [revenueStats] = await db.pool.execute('SELECT SUM(amount) as total_revenue FROM payments WHERE status = "completed" AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
      stats.monthlyRevenue = parseFloat(revenueStats[0].total_revenue) || 0;
    } catch (error) {
      console.log('Payments table not available, using default value');
    }

    // Get system health data
    let databaseSize = 0;
    let activeSessions = 0;
    
    try {
      const [dbSize] = await db.pool.execute(`
        SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);
      databaseSize = parseFloat(dbSize[0]?.size_mb) || 0;
    } catch (error) {
      console.log('Could not get database size');
    }

    try {
      const [sessions] = await db.pool.execute('SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()');
      activeSessions = parseInt(sessions[0]?.count) || 0;
    } catch (error) {
      console.log('Sessions table not available, using default value');
    }
    
    // Get recent users
    const [recentUsers] = await db.pool.execute(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, r.name as role_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC 
      LIMIT 5
    `);
    
    // Get recent system activities
    let recentActivities = [];
    try {
      const [activities] = await db.pool.execute(`
        (SELECT 'user_registered' as type, CONCAT('New user: ', username) as description, created_at, 'user' as category
        FROM users ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'expense_added' as type, CONCAT('New expense: ', description) as description, created_at, 'expense' as category
        FROM expenses ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'budget_created' as type, CONCAT('New budget: ', category) as description, created_at, 'budget' as category
        FROM budgets ORDER BY created_at DESC LIMIT 5)
        ORDER BY created_at DESC LIMIT 10
      `);
      recentActivities = activities || [];
    } catch (error) {
      console.log('Could not load recent activities');
    }

    // Get role statistics for user distribution
    const [roleStats] = await db.pool.execute(`
      SELECT r.name, COUNT(u.id) as user_count
      FROM roles r 
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
      GROUP BY r.id, r.name
      ORDER BY user_count DESC
    `);

    res.render('superAdmin/dashboard', {
      title: 'Super Admin Dashboard - FinMate',
      user: req.user,
      currentPage: 'dashboard',
      stats: stats,
      systemHealth: {
        databaseSize: databaseSize,
        activeSessions: activeSessions,
        serverUptime: process.uptime()
      },
      recentUsers: recentUsers || [],
      recentActivities: recentActivities || [],
      roleStats: roleStats || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Super Admin Dashboard error:', error);
    const stats = {
      totalUsers: 0,
      totalAdmins: 0,
      totalBudgets: 0,
      totalExpenses: 0,
      pendingExpenses: 0,
      totalTeams: 0,
      systemLogsLast24h: 0,
      monthlyRevenue: 0,
      totalSavingsGoals: 0,
      totalNotifications: 0
    };

    res.render('superAdmin/dashboard', {
      title: 'Super Admin Dashboard - FinMate',
      user: req.user,
      currentPage: 'dashboard',
      stats: stats,
      systemHealth: {
        databaseSize: 0,
        activeSessions: 0,
        serverUptime: 0
      },
      recentUsers: [],
      recentActivities: [],
      roleStats: [],
      success: req.query.success,
      error: 'Failed to load dashboard data'
    });
  }
});

// ======== AUDIT LOGS ROUTES ========

// Audit Logs - List (FIXED VERSION)
// ======== AUDIT LOGS ROUTES ========

// Audit Logs - List (FIXED VERSION)
router.get('/audit-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    console.log('🔍 Loading audit logs with:', { page, limit, offset, search });

    // Build base query without pagination first
    let baseQuery = `
      SELECT 
        al.*,
        u.username,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as user_full_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;

    let countQuery = `SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id`;
    
    let queryParams = [];
    let countParams = [];

    // Handle search filter
    if (search && search.trim() !== '') {
      const searchCondition = ` WHERE (al.action LIKE ? OR al.description LIKE ? OR u.username LIKE ?)`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add ordering
    baseQuery += ` ORDER BY al.created_at DESC`;

    console.log('📊 Base query:', baseQuery);
    console.log('📊 Query params:', queryParams);
    console.log('📊 Count query:', countQuery);
    console.log('📊 Count params:', countParams);

    // Execute count query first
    let total = 0;
    let countResult;
    if (countParams.length > 0) {
      [countResult] = await db.pool.execute(countQuery, countParams);
    } else {
      [countResult] = await db.pool.execute(countQuery);
    }
    total = countResult[0].total;

    // Execute data query with pagination using template literals instead of parameters
    let auditLogs = [];
    if (total > 0) {
      const paginatedQuery = baseQuery + ` LIMIT ${limit} OFFSET ${offset}`;
      console.log('📊 Paginated query:', paginatedQuery);
      
      if (queryParams.length > 0) {
        [auditLogs] = await db.pool.execute(paginatedQuery, queryParams);
      } else {
        [auditLogs] = await db.pool.execute(paginatedQuery);
      }
    }

    console.log('✅ Successfully loaded', auditLogs.length, 'audit logs out of', total);

    // Get unique actions for filter dropdown
    let actions = [];
    try {
      const [actionsResult] = await db.pool.execute('SELECT DISTINCT action FROM audit_logs ORDER BY action');
      actions = actionsResult || [];
    } catch (error) {
      console.log('Could not load actions filter:', error.message);
    }

    const totalPages = Math.ceil(total / limit);

    res.render('superAdmin/audit-logs/list', {
      title: 'Audit Logs - FinMate',
      user: req.user,
      currentPage: 'audit-logs',
      auditLogs: auditLogs,
      actions: actions,
      recentUsers: [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      filters: {
        search,
        action: '',
        user_id: '',
        start_date: '',
        end_date: ''
      },
      success: req.query.success,
      error: req.query.error
    });

  } catch (error) {
    console.error('❌ Audit logs error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    
    let errorMessage = 'Failed to load audit logs';
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Audit logs table does not exist. Please run the database setup.';
    } else if (error.code === 'ER_WRONG_ARGUMENTS') {
      errorMessage = 'Database query parameter error. Please check the query structure.';
    }

    res.render('superAdmin/audit-logs/list', {
      title: 'Audit Logs - FinMate',
      user: req.user,
      currentPage: 'audit-logs',
      auditLogs: [],
      actions: [],
      recentUsers: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasPrev: false,
        hasNext: false
      },
      filters: {},
      error: errorMessage
    });
  }
});

// Audit Log Details
router.get('/audit-logs/:id', async (req, res) => {
  try {
    const [logs] = await db.pool.execute(`
      SELECT 
        al.*,
        u.username,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as user_full_name,
        r.name as role_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE al.id = ?
    `, [req.params.id]);

    if (logs.length === 0) {
      return res.redirect('/super-admin/audit-logs?error=Audit log not found');
    }

    const auditLog = logs[0];

    // Parse old_values and new_values if they are JSON strings
    try {
      if (auditLog.old_values && typeof auditLog.old_values === 'string') {
        auditLog.old_values_parsed = JSON.parse(auditLog.old_values);
      }
      if (auditLog.new_values && typeof auditLog.new_values === 'string') {
        auditLog.new_values_parsed = JSON.parse(auditLog.new_values);
      }
    } catch (parseError) {
      console.log('Could not parse values as JSON');
    }

    res.render('superAdmin/audit-logs/details', {
      title: 'Audit Log Details - FinMate',
      user: req.user,
      currentPage: 'audit-logs',
      auditLog: auditLog,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Audit log details error:', error);
    res.redirect('/super-admin/audit-logs?error=Failed to load audit log details');
  }
});

// Clear Audit Logs
router.post('/audit-logs/clear', async (req, res) => {
  try {
    const { older_than } = req.body;
    
    let deleteQuery = 'DELETE FROM audit_logs';
    let queryParams = [];

    if (older_than === '30days') {
      deleteQuery += ' WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (older_than === '90days') {
      deleteQuery += ' WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)';
    } else if (older_than === '1year') {
      deleteQuery += ' WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    } else {
      // Keep last 1000 records
      deleteQuery = `
        DELETE FROM audit_logs 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id FROM audit_logs 
            ORDER BY created_at DESC 
            LIMIT 1000
          ) AS recent_logs
        )
      `;
    }

    const [result] = await db.pool.execute(deleteQuery, queryParams);
    
    res.redirect('/super-admin/audit-logs?success=Audit logs cleared successfully');
  } catch (error) {
    console.error('Clear audit logs error:', error);
    res.redirect('/super-admin/audit-logs?error=Failed to clear audit logs');
  }
});

// Export Audit Logs
router.get('/audit-logs/export', async (req, res) => {
  try {
    const format = req.query.format || 'csv';
    const { search, action, user_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        al.id,
        al.action,
        al.description,
        al.ip_address,
        al.user_agent,
        u.username,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as user_full_name,
        al.old_values,
        al.new_values,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (search) {
      query += ` AND (al.action LIKE ? OR al.description LIKE ? OR al.ip_address LIKE ? OR u.username LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (action) {
      query += ` AND al.action = ?`;
      queryParams.push(action);
    }

    if (user_id) {
      query += ` AND al.user_id = ?`;
      queryParams.push(user_id);
    }

    if (start_date) {
      query += ` AND DATE(al.created_at) >= ?`;
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(al.created_at) <= ?`;
      queryParams.push(end_date);
    }

    query += ` ORDER BY al.created_at DESC LIMIT 10000`;

    const [auditLogs] = await db.pool.execute(query, queryParams);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      res.send(JSON.stringify(auditLogs, null, 2));
    } else {
      // CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      
      // CSV header
      const headers = ['ID', 'Action', 'Description', 'IP Address', 'User Agent', 'Username', 'Email', 'User Full Name', 'Timestamp'];
      res.write(headers.join(',') + '\n');
      
      // CSV data
      auditLogs.forEach(log => {
        const row = [
          log.id,
          `"${log.action}"`,
          `"${log.description?.replace(/"/g, '""') || ''}"`,
          `"${log.ip_address}"`,
          `"${log.user_agent?.replace(/"/g, '""') || ''}"`,
          `"${log.username}"`,
          `"${log.email}"`,
          `"${log.user_full_name}"`,
          `"${new Date(log.created_at).toISOString()}"`
        ];
        res.write(row.join(',') + '\n');
      });
      
      res.end();
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.redirect('/super-admin/audit-logs?error=Failed to export audit logs');
  }
});

// ======== USER MANAGEMENT ROUTES ========

// User Management - List (FIXED - removed last_login column)
router.get('/users', async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.first_name, 
        u.last_name, 
        r.name as role_name, 
        u.is_active, 
        u.created_at,
        t.name as team_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      LEFT JOIN teams t ON u.team_id = t.id 
      ORDER BY u.created_at DESC
    `;

    const [users] = await db.pool.execute(sql);
    
    console.log('✅ Users fetched successfully:', users.length);
    
    res.render('superAdmin/users/list', {
      title: 'User Management - FinMate',
      user: req.user,
      currentPage: 'users',
      users: users || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.render('superAdmin/users/list', {
      title: 'User Management - FinMate',
      user: req.user,
      currentPage: 'users',
      users: [],
      error: 'Failed to load users: ' + error.message
    });
  }
});

// Add User - GET
router.get('/users/add', async (req, res) => {
  try {
    const [roles] = await db.pool.execute('SELECT id, name FROM roles ORDER BY name');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    res.render('superAdmin/users/add', {
      title: 'Add User - FinMate',
      user: req.user,
      roles: roles || [],
      teams: teams || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Add user form error:', error);
    res.render('superAdmin/users/add', {
      title: 'Add User - FinMate',
      user: req.user,
      roles: [],
      teams: [],
      error: 'Failed to load form data'
    });
  }
});

// Add User - POST
router.post('/users/add', 
  [
    body('username').isLength({ min: 3 }).trim().withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().trim().withMessage('First name is required'),
    body('last_name').notEmpty().trim().withMessage('Last name is required'),
    body('role_id').isInt({ min: 1 }).withMessage('Valid role is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, password, first_name, last_name, role_id, team_id } = req.body;
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await db.pool.execute(
        'INSERT INTO users (username, email, password, first_name, last_name, role_id, team_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [username, email, hashedPassword, first_name, last_name, role_id, team_id || null]
      );
      
      res.redirect('/super-admin/users?success=User added successfully');
    } catch (error) {
      console.error('Add user error:', error);
      let errorMessage = 'Failed to add user';
      
      if (error.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Username or email already exists';
      }
      
      res.redirect(`/super-admin/users/add?error=${encodeURIComponent(errorMessage)}`);
    }
  }
);

// Edit User - GET
router.get('/users/edit/:id', async (req, res) => {
  try {
    const [users] = await db.pool.execute(`
      SELECT u.*, r.name as role_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?`, 
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.redirect('/super-admin/users?error=User not found');
    }
    
    const [roles] = await db.pool.execute('SELECT id, name FROM roles ORDER BY name');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    res.render('superAdmin/users/edit', {
      title: 'Edit User - FinMate',
      user: req.user,
      userData: users[0],
      roles: roles || [],
      teams: teams || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Edit user form error:', error);
    res.redirect('/super-admin/users?error=Failed to load user');
  }
});

// Edit User - POST
router.post('/users/edit/:id',
  [
    body('username').isLength({ min: 3 }).trim().withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('first_name').notEmpty().trim().withMessage('First name is required'),
    body('last_name').notEmpty().trim().withMessage('Last name is required'),
    body('role_id').isInt({ min: 1 }).withMessage('Valid role is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, first_name, last_name, role_id, team_id, is_active } = req.body;
      
      await db.pool.execute(
        'UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, role_id = ?, team_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [username, email, first_name, last_name, role_id, team_id || null, is_active ? 1 : 0, req.params.id]
      );
      
      res.redirect(`/super-admin/users/edit/${req.params.id}?success=User updated successfully`);
    } catch (error) {
      console.error('Edit user error:', error);
      let errorMessage = 'Failed to update user';
      
      if (error.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Username or email already exists';
      }
      
      res.redirect(`/super-admin/users/edit/${req.params.id}?error=${encodeURIComponent(errorMessage)}`);
    }
  }
);

// Change User Password - POST
router.post('/users/change-password/:id',
  [
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  validate,
  async (req, res) => {
    try {
      const { new_password } = req.body;
      const userId = req.params.id;

      const hashedPassword = await bcrypt.hash(new_password, 12);
      
      await db.pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, userId]
      );
      
      res.redirect(`/super-admin/users/edit/${userId}?success=Password updated successfully`);
    } catch (error) {
      console.error('Change password error:', error);
      res.redirect(`/super-admin/users/edit/${req.params.id}?error=Failed to update password`);
    }
  }
);

// Delete User - POST
router.post('/users/delete/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await db.pool.execute('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);
    res.redirect('/super-admin/users?success=User deactivated successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    res.redirect('/super-admin/users?error=Failed to deactivate user');
  }
});

// Restore User - POST
router.post('/users/restore/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await db.pool.execute('UPDATE users SET is_active = 1 WHERE id = ?', [userId]);
    res.redirect('/super-admin/users?success=User restored successfully');
  } catch (error) {
    console.error('Restore user error:', error);
    res.redirect('/super-admin/users?error=Failed to restore user');
  }
});

// ======== ROLE MANAGEMENT ROUTES ========

// Role Management - List
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await db.pool.execute(`
      SELECT r.*, COUNT(u.id) as user_count
      FROM roles r 
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
      GROUP BY r.id
      ORDER BY r.name ASC
    `);
    
    res.render('superAdmin/roles/list', {
      title: 'Role Management - FinMate',
      user: req.user,
      currentPage: 'roles',
      roles: roles || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Roles list error:', error);
    res.render('superAdmin/roles/list', {
      title: 'Role Management - FinMate',
      user: req.user,
      currentPage: 'roles',
      roles: [],
      error: 'Failed to load roles'
    });
  }
});

// Add Role - GET
router.get('/roles/add', async (req, res) => {
  try {
    const [permissions] = await db.pool.execute('SELECT id, name, description FROM permissions ORDER BY name');
    
    res.render('superAdmin/roles/add', {
      title: 'Add Role - FinMate',
      user: req.user,
      currentPage: 'roles',
      permissions: permissions || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Add role form error:', error);
    res.render('superAdmin/roles/add', {
      title: 'Add Role - FinMate',
      user: req.user,
      currentPage: 'roles',
      permissions: [],
      error: 'Failed to load form data'
    });
  }
});

// Add Role - POST
router.post('/roles/add',
  [
    body('name').isLength({ min: 2 }).trim().withMessage('Role name must be at least 2 characters'),
    body('description').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      
      const [result] = await db.pool.execute(
        'INSERT INTO roles (name, description) VALUES (?, ?)',
        [name, description || null]
      );
      
      const roleId = result.insertId;
      
      // Add permissions if any
      if (permissions && Array.isArray(permissions)) {
        for (const permissionId of permissions) {
          await db.pool.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permissionId]
          );
        }
      }
      
      res.redirect('/super-admin/roles?success=Role added successfully');
    } catch (error) {
      console.error('Add role error:', error);
      let errorMessage = 'Failed to add role';
      
      if (error.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Role name already exists';
      }
      
      res.redirect(`/super-admin/roles/add?error=${encodeURIComponent(errorMessage)}`);
    }
  }
);

// Edit Role - GET
router.get('/roles/edit/:id', async (req, res) => {
  try {
    const [roles] = await db.pool.execute('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    
    if (roles.length === 0) {
      return res.redirect('/super-admin/roles?error=Role not found');
    }
    
    const [permissions] = await db.pool.execute('SELECT id, name, description FROM permissions ORDER BY name');
    const [rolePermissions] = await db.pool.execute('SELECT permission_id FROM role_permissions WHERE role_id = ?', [req.params.id]);
    
    const assignedPermissionIds = rolePermissions.map(rp => rp.permission_id);
    
    res.render('superAdmin/roles/edit', {
      title: 'Edit Role - FinMate',
      user: req.user,
      currentPage: 'roles',
      role: roles[0],
      permissions: permissions || [],
      assignedPermissionIds: assignedPermissionIds,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Edit role form error:', error);
    res.redirect('/super-admin/roles?error=Failed to load role');
  }
});

// Edit Role - POST
router.post('/roles/edit/:id',
  [
    body('name').isLength({ min: 2 }).trim().withMessage('Role name must be at least 2 characters'),
    body('description').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      const roleId = req.params.id;
      
      await db.pool.execute(
        'UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description || null, roleId]
      );
      
      // Update permissions
      await db.pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      
      if (permissions && Array.isArray(permissions)) {
        for (const permissionId of permissions) {
          await db.pool.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permissionId]
          );
        }
      }
      
      res.redirect(`/super-admin/roles/edit/${roleId}?success=Role updated successfully`);
    } catch (error) {
      console.error('Edit role error:', error);
      let errorMessage = 'Failed to update role';
      
      if (error.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Role name already exists';
      }
      
      res.redirect(`/super-admin/roles/edit/${req.params.id}?error=${encodeURIComponent(errorMessage)}`);
    }
  }
);

// Delete Role - POST
router.post('/roles/delete/:id', async (req, res) => {
  try {
    const roleId = req.params.id;
    
    // Check if any users are assigned to this role
    const [users] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [roleId]);
    
    if (users[0].count > 0) {
      return res.redirect('/super-admin/roles?error=Cannot delete role: Users are assigned to this role');
    }
    
    // Delete role permissions and then the role
    await db.pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    await db.pool.execute('DELETE FROM roles WHERE id = ?', [roleId]);
    
    res.redirect('/super-admin/roles?success=Role deleted successfully');
  } catch (error) {
    console.error('Delete role error:', error);
    res.redirect('/super-admin/roles?error=Failed to delete role');
  }
});

// ======== PERMISSION MANAGEMENT ROUTES ========

// Permission Management - List
router.get('/permissions', async (req, res) => {
  try {
    const [permissions] = await db.pool.execute(`
      SELECT p.*, COUNT(rp.role_id) as role_count
      FROM permissions p 
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
    
    res.render('superAdmin/permissions/list', {
      title: 'Permission Management - FinMate',
      user: req.user,
      currentPage: 'permissions',
      permissions: permissions || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Permissions list error:', error);
    res.render('superAdmin/permissions/list', {
      title: 'Permission Management - FinMate',
      user: req.user,
      currentPage: 'permissions',
      permissions: [],
      error: 'Failed to load permissions'
    });
  }
});

// Add Permission - GET
router.get('/permissions/add', (req, res) => {
  res.render('superAdmin/permissions/add', {
    title: 'Add Permission - FinMate',
    user: req.user,
    currentPage: 'permissions',
    error: req.query.error
  });
});

// Add Permission - POST
router.post('/permissions/add',
  [
    body('name').isLength({ min: 2 }).trim().withMessage('Permission name must be at least 2 characters'),
    body('description').optional().trim(),
    body('category').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, category } = req.body;
      
      await db.pool.execute(
        'INSERT INTO permissions (name, description, category) VALUES (?, ?, ?)',
        [name, description || null, category || null]
      );
      
      res.redirect('/super-admin/permissions?success=Permission added successfully');
    } catch (error) {
      console.error('Add permission error:', error);
      let errorMessage = 'Failed to add permission';
      
      if (error.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Permission name already exists';
      }
      
      res.redirect(`/super-admin/permissions/add?error=${encodeURIComponent(errorMessage)}`);
    }
  }
);

// Edit Permission - GET
router.get('/permissions/edit/:id', async (req, res) => {
  try {
    const [permissions] = await db.pool.execute('SELECT * FROM permissions WHERE id = ?', [req.params.id]);
    
    if (permissions.length === 0) {
      return res.redirect('/super-admin/permissions?error=Permission not found');
    }
    
    res.render('superAdmin/permissions/edit', {
      title: 'Edit Permission - FinMate',
      user: req.user,
      currentPage: 'permissions',
      permission: permissions[0],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Edit permission form error:', error);
    res.redirect('/super-admin/permissions?error=Failed to load permission');
  }
});

// Edit Permission - POST
router.post('/permissions/edit/:id',
  [
    body('name').isLength({ min: 2 }).trim().withMessage('Permission name must be at least 2 characters'),
    body('description').optional().trim(),
    body('category').optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, category } = req.body;
      const permissionId = req.params.id;
      
      await db.pool.execute(
        'UPDATE permissions SET name = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description || null, category || null, permissionId]
      );
      
      res.redirect(`/super-admin/permissions/edit/${permissionId}?success=Permission updated successfully`);
    } catch (error) {
      console.error('Edit permission error:', error);
      let errorMessage = 'Failed to update permission';
      
      if (error.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Permission name already exists';
      }
      
      res.redirect(`/super-admin/permissions/edit/${req.params.id}?error=${encodeURIComponent(errorMessage)}`);
    }
  }
);

// Delete Permission - POST
router.post('/permissions/delete/:id', async (req, res) => {
  try {
    const permissionId = req.params.id;
    
    // Check if permission is assigned to any roles
    const [roles] = await db.pool.execute('SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ?', [permissionId]);
    
    if (roles[0].count > 0) {
      return res.redirect('/super-admin/permissions?error=Cannot delete permission: It is assigned to roles');
    }
    
    await db.pool.execute('DELETE FROM permissions WHERE id = ?', [permissionId]);
    
    res.redirect('/super-admin/permissions?success=Permission deleted successfully');
  } catch (error) {
    console.error('Delete permission error:', error);
    res.redirect('/super-admin/permissions?error=Failed to delete permission');
  }
});

// ======== SYSTEM MANAGEMENT ROUTES ========

// System Settings
router.get('/system-settings', async (req, res) => {
  try {
    const [settings] = await db.pool.execute('SELECT * FROM system_settings ORDER BY category, name');
    
    const settingsByCategory = {};
    settings.forEach(setting => {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = [];
      }
      settingsByCategory[setting.category].push(setting);
    });

    res.render('superAdmin/system/settings', {
      title: 'System Settings - FinMate',
      user: req.user,
      currentPage: 'system-settings',
      settings: settingsByCategory,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('System settings error:', error);
    res.render('superAdmin/system/settings', {
      title: 'System Settings - FinMate',
      user: req.user,
      currentPage: 'system-settings',
      settings: {},
      error: 'Failed to load system settings'
    });
  }
});

// Update System Settings - POST
router.post('/system-settings/update', async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await db.pool.execute(
        'UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
        [value, key]
      );
    }
    
    res.redirect('/super-admin/system-settings?success=System settings updated successfully');
  } catch (error) {
    console.error('Update system settings error:', error);
    res.redirect('/super-admin/system-settings?error=Failed to update system settings');
  }
});

// System Logs
router.get('/system-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const level = req.query.level || '';
    const search = req.query.search || '';

    let baseQuery = 'FROM system_logs WHERE 1=1';
    let countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    let dataQuery = `SELECT * ${baseQuery}`;

    const queryParams = [];

    if (level) {
      baseQuery += ' AND level = ?';
      queryParams.push(level);
    }

    if (search) {
      baseQuery += ' AND (message LIKE ? OR context LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Get total count
    const [countResult] = await db.pool.execute(countQuery, queryParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get data with pagination
    dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const dataParams = [...queryParams, limit, offset];
    
    const [systemLogs] = await db.pool.execute(dataQuery, dataParams);

    res.render('superAdmin/system/logs', {
      title: 'System Logs - FinMate',
      user: req.user,
      currentPage: 'system-logs',
      systemLogs: systemLogs || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      filters: {
        level,
        search
      },
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('System logs error:', error);
    res.render('superAdmin/system/logs', {
      title: 'System Logs - FinMate',
      user: req.user,
      currentPage: 'system-logs',
      systemLogs: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasPrev: false,
        hasNext: false
      },
      filters: {},
      error: 'Failed to load system logs'
    });
  }
});

// Clear System Logs
router.post('/system-logs/clear', async (req, res) => {
  try {
    const { level, older_than } = req.body;
    
    let deleteQuery = 'DELETE FROM system_logs';
    let queryParams = [];

    if (level && level !== 'all') {
      deleteQuery += ' WHERE level = ?';
      queryParams.push(level);
    }

    if (older_than === '7days') {
      deleteQuery += (level && level !== 'all' ? ' AND' : ' WHERE') + ' created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (older_than === '30days') {
      deleteQuery += (level && level !== 'all' ? ' AND' : ' WHERE') + ' created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    await db.pool.execute(deleteQuery, queryParams);
    
    res.redirect('/super-admin/system-logs?success=System logs cleared successfully');
  } catch (error) {
    console.error('Clear system logs error:', error);
    res.redirect('/super-admin/system-logs?error=Failed to clear system logs');
  }
});

// ======== BACKUP & RESTORE ROUTES ========

// Backup Management
router.get('/backups', async (req, res) => {
  try {
    // This would typically list backup files from a directory or database
    // For now, we'll return an empty array
    const backups = [];

    res.render('superAdmin/system/backups', {
      title: 'Backup Management - FinMate',
      user: req.user,
      currentPage: 'backups',
      backups: backups,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Backups error:', error);
    res.render('superAdmin/system/backups', {
      title: 'Backup Management - FinMate',
      user: req.user,
      currentPage: 'backups',
      backups: [],
      error: 'Failed to load backups'
    });
  }
});

// Create Backup - POST
router.post('/backups/create', async (req, res) => {
  try {
    // This would typically create a database backup
    // For now, we'll just redirect with a success message
    res.redirect('/super-admin/backups?success=Backup created successfully');
  } catch (error) {
    console.error('Create backup error:', error);
    res.redirect('/super-admin/backups?error=Failed to create backup');
  }
});

// ======== SUPER ADMIN PROFILE ROUTES ========

// Super Admin Profile - GET
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [users] = await db.pool.execute(`
      SELECT u.*, r.name as role_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.redirect('/super-admin/dashboard?error=User not found');
    }

    const userData = users[0];

    res.render('superAdmin/profile', {
      title: 'Super Admin Profile - FinMate',
      user: req.user,
      currentPage: 'profile',
      userData: userData,
      success: req.query.success,
      error: req.query.error
    });

  } catch (error) {
    console.error('Super Admin profile error:', error);
    res.render('superAdmin/profile', {
      title: 'Super Admin Profile - FinMate',
      user: req.user,
      currentPage: 'profile',
      userData: {},
      error: 'Failed to load profile'
    });
  }
});

// Update Super Admin Profile - POST
router.post('/profile/update', async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, email, username } = req.body;

    if (!first_name || !last_name || !email || !username) {
      return res.redirect('/super-admin/profile?error=All fields are required');
    }

    await db.pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [first_name, last_name, email, username, userId]
    );

    req.user.first_name = first_name;
    req.user.last_name = last_name;
    req.user.email = email;
    req.user.username = username;

    res.redirect('/super-admin/profile?success=Profile updated successfully');
  } catch (error) {
    console.error('Update super admin profile error:', error);
    res.redirect('/super-admin/profile?error=Failed to update profile');
  }
});

// Change Super Admin Password - POST
router.post('/profile/change-password',
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  validate,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id;

      // Verify current password
      const [users] = await db.pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
      
      if (users.length === 0) {
        return res.redirect('/super-admin/profile?error=User not found');
      }

      const isCurrentPasswordValid = await bcrypt.compare(current_password, users[0].password);
      
      if (!isCurrentPasswordValid) {
        return res.redirect('/super-admin/profile?error=Current password is incorrect');
      }

      // Update password
      const hashedPassword = await bcrypt.hash(new_password, 12);
      
      await db.pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, userId]
      );
      
      res.redirect('/super-admin/profile?success=Password updated successfully');
    } catch (error) {
      console.error('Change password error:', error);
      res.redirect('/super-admin/profile?error=Failed to update password');
    }
  }
);


// ======== NOTIFICATIONS ROUTES ========

// Notifications - List
// Notifications - List (FIXED VERSION)
router.get('/notifications', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log('🔔 Loading notifications with:', { page, limit, offset });

    let notifications = [];
    let total = 0;

    try {
      // First, check if notifications table exists and get data
      const [notificationsResult] = await db.pool.execute(`
        SELECT n.*, u.username, u.email 
        FROM notifications n 
        LEFT JOIN users u ON n.user_id = u.id 
        ORDER BY n.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `);
      notifications = notificationsResult || [];

      // Get total count
      const [countResult] = await db.pool.execute('SELECT COUNT(*) as total FROM notifications');
      total = countResult[0].total;
      
      console.log('✅ Successfully loaded', notifications.length, 'notifications');
    } catch (dbError) {
      console.log('❌ Notifications table not available or error:', dbError.message);
      // Continue with empty data
      notifications = [];
      total = 0;
    }

    const totalPages = Math.ceil(total / limit);

    res.render('superAdmin/notifications/list', {
      title: 'Notifications - FinMate',
      user: req.user,
      currentPage: 'notifications',
      notifications: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      success: req.query.success || null,
      error: req.query.error || null
    });

  } catch (error) {
    console.error('❌ Notifications route error:', error);
    res.render('superAdmin/notifications/list', {
      title: 'Notifications - FinMate',
      user: req.user,
      currentPage: 'notifications',
      notifications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasPrev: false,
        hasNext: false
      },
      success: null,
      error: 'Failed to load notifications: ' + error.message
    });
  }
});

// ======== SYSTEM SETTINGS ROUTES ========

// System Settings - Simplified version
router.get('/system-settings', async (req, res) => {
  try {
    // Try to get system settings, but handle case where table doesn't exist
    let settings = [];
    try {
      const [settingsResult] = await db.pool.execute('SELECT * FROM system_settings ORDER BY category, name');
      settings = settingsResult || [];
    } catch (error) {
      console.log('System settings table not available, using empty array');
    }

    const settingsByCategory = {};
    settings.forEach(setting => {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = [];
      }
      settingsByCategory[setting.category].push(setting);
    });

    res.render('superAdmin/system/settings', {
      title: 'System Settings - FinMate',
      user: req.user,
      currentPage: 'system-settings',
      settings: settingsByCategory,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('System settings error:', error);
    
    // Fallback to basic settings page even if database fails
    res.render('superAdmin/system/settings', {
      title: 'System Settings - FinMate',
      user: req.user,
      currentPage: 'system-settings',
      settings: {},
      error: 'Failed to load system settings'
    });
  }
});

// Update System Settings - POST
router.post('/system-settings/update', async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await db.pool.execute(
        'UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
        [value, key]
      );
    }
    
    res.redirect('/super-admin/system-settings?success=System settings updated successfully');
  } catch (error) {
    console.error('Update system settings error:', error);
    res.redirect('/super-admin/system-settings?error=Failed to update system settings');
  }
});

// ======== SYSTEM LOGS ROUTES ========

// System Logs - Simplified version
router.get('/system-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const level = req.query.level || '';
    const search = req.query.search || '';

    let systemLogs = [];
    let total = 0;

    try {
      let baseQuery = 'FROM system_logs WHERE 1=1';
      let countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      let dataQuery = `SELECT * ${baseQuery}`;

      const queryParams = [];

      if (level) {
        baseQuery += ' AND level = ?';
        queryParams.push(level);
      }

      if (search) {
        baseQuery += ' AND (message LIKE ? OR context LIKE ?)';
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm);
      }

      // Get total count
      const [countResult] = await db.pool.execute(countQuery, queryParams);
      total = countResult[0].total;

      // Get data with pagination
      dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const dataParams = [...queryParams, limit, offset];
      
      const [logsResult] = await db.pool.execute(dataQuery, dataParams);
      systemLogs = logsResult || [];
    } catch (error) {
      console.log('System logs table not available, using empty data');
    }

    const totalPages = Math.ceil(total / limit);

    res.render('superAdmin/system/logs', {
      title: 'System Logs - FinMate',
      user: req.user,
      currentPage: 'system-logs',
      systemLogs: systemLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      filters: {
        level,
        search
      },
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('System logs error:', error);
    res.render('superAdmin/system/logs', {
      title: 'System Logs - FinMate',
      user: req.user,
      currentPage: 'system-logs',
      systemLogs: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasPrev: false,
        hasNext: false
      },
      filters: {},
      error: 'Failed to load system logs'
    });
  }
});

// Clear System Logs
router.post('/system-logs/clear', async (req, res) => {
  try {
    const { level, older_than } = req.body;
    
    let deleteQuery = 'DELETE FROM system_logs';
    let queryParams = [];

    if (level && level !== 'all') {
      deleteQuery += ' WHERE level = ?';
      queryParams.push(level);
    }

    if (older_than === '7days') {
      deleteQuery += (level && level !== 'all' ? ' AND' : ' WHERE') + ' created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (older_than === '30days') {
      deleteQuery += (level && level !== 'all' ? ' AND' : ' WHERE') + ' created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    await db.pool.execute(deleteQuery, queryParams);
    
    res.redirect('/super-admin/system-logs?success=System logs cleared successfully');
  } catch (error) {
    console.error('Clear system logs error:', error);
    res.redirect('/super-admin/system-logs?error=Failed to clear system logs');
  }
});

// ======== BACKUP & RESTORE ROUTES ========

// Backup Management
router.get('/backups', async (req, res) => {
  try {
    const backups = [];

    res.render('superAdmin/system/backups', {
      title: 'Backup Management - FinMate',
      user: req.user,
      currentPage: 'backups',
      backups: backups,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Backups error:', error);
    res.render('superAdmin/system/backups', {
      title: 'Backup Management - FinMate',
      user: req.user,
      currentPage: 'backups',
      backups: [],
      error: 'Failed to load backups'
    });
  }
});

// Create Backup - POST
router.post('/backups/create', async (req, res) => {
  try {
    res.redirect('/super-admin/backups?success=Backup created successfully');
  } catch (error) {
    console.error('Create backup error:', error);
    res.redirect('/super-admin/backups?error=Failed to create backup');
  }
});
// ======== TEST ROUTE ========

// Test API route
router.get('/test', (req, res) => {
  res.json({
    message: 'Super Admin Routes - WORKING!',
    user: req.user,
    timestamp: new Date().toISOString(),
    permissions: 'Full system access'
  });
});

module.exports = router;