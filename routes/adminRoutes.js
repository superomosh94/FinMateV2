// routes/adminRoutes.js
const express = require('express');
const { authenticate, requireAnyRole } = require('../middlewares/authMiddleware');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const router = express.Router();

// Apply authentication and authorization
router.use(authenticate);
router.use(requireAnyRole(['admin', 'super_admin']));

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const [budgetCount] = await db.pool.execute('SELECT COUNT(*) as count FROM budgets');
    const [expenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses');
    const [pendingExpenses] = await db.pool.execute("SELECT COUNT(*) as count FROM expenses WHERE status = 'pending'");
    const [teamCount] = await db.pool.execute('SELECT COUNT(*) as count FROM teams');
    const [notificationCount] = await db.pool.execute('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0');

    const stats = {
      totalUsers: userCount[0].count,
      totalBudgets: budgetCount[0].count,
      totalExpenses: expenseCount[0].count,
      pendingExpenses: pendingExpenses[0].count,
      totalTeams: teamCount[0].count,
      pendingNotifications: notificationCount[0].count
    };

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - FinMate',
      user: req.user,
      currentPage: 'dashboard',
      stats: stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    const stats = {
      totalUsers: 0,
      totalBudgets: 0,
      totalExpenses: 0,
      pendingExpenses: 0,
      totalTeams: 0,
      pendingNotifications: 0
    };

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - FinMate',
      user: req.user,
      currentPage: 'dashboard',
      stats: stats,
      error: 'Failed to load dashboard data'
    });
  }
});

// ======== ADMIN PROFILE ROUTES ========

// Admin Profile - GET
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get admin user data with role and team information
    const [users] = await db.pool.execute(`
      SELECT u.*, r.name as role_name, t.name as team_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      LEFT JOIN teams t ON u.team_id = t.id 
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.redirect('/admin/dashboard?error=User not found');
    }

    const userData = users[0];

    // Get admin-specific statistics
    const [userStats] = await db.pool.execute('SELECT COUNT(*) as total_users FROM users WHERE is_active = 1');
    const [expenseStats] = await db.pool.execute('SELECT COUNT(*) as total_expenses, SUM(amount) as total_amount FROM expenses');
    const [budgetStats] = await db.pool.execute('SELECT COUNT(*) as total_budgets, SUM(amount) as total_amount FROM budgets');
    const [pendingExpenses] = await db.pool.execute('SELECT COUNT(*) as pending_count FROM expenses WHERE status = "pending"');
    const [teamStats] = await db.pool.execute('SELECT COUNT(*) as total_teams FROM teams');

    // Get recent admin activities
    const [recentActivities] = await db.pool.execute(`
      (SELECT 'user_created' as type, CONCAT('Created user: ', username) as description, created_at
      FROM users ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'expense_approved' as type, CONCAT('Approved expense: ', description) as description, updated_at as created_at
      FROM expenses WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 5)
      ORDER BY created_at DESC LIMIT 8
    `);

    const adminAnalytics = {
      users: userStats[0] || { total_users: 0 },
      expenses: expenseStats[0] || { total_expenses: 0, total_amount: 0 },
      budgets: budgetStats[0] || { total_budgets: 0, total_amount: 0 },
      pendingExpenses: pendingExpenses[0] || { pending_count: 0 },
      teams: teamStats[0] || { total_teams: 0 }
    };

    res.render('admin/profile', {
      title: 'Admin Profile - FinMate',
      user: req.user,
      userData: userData,
      adminAnalytics: adminAnalytics,
      recentActivities: recentActivities || [],
      currentPage: 'profile',
      success: req.query.success,
      error: req.query.error
    });

  } catch (error) {
    console.error('Admin profile error:', error);
    res.render('admin/profile', {
      title: 'Admin Profile - FinMate',
      user: req.user,
      userData: {},
      adminAnalytics: {},
      recentActivities: [],
      currentPage: 'profile',
      error: 'Failed to load profile'
    });
  }
});

// Update Admin Profile - POST
router.post('/profile/update', async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, email, username } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !username) {
      return res.redirect('/admin/profile?error=All fields are required');
    }

    await db.pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [first_name, last_name, email, username, userId]
    );

    // Update session user data
    req.user.first_name = first_name;
    req.user.last_name = last_name;
    req.user.email = email;
    req.user.username = username;

    res.redirect('/admin/profile?success=Profile updated successfully');
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.redirect('/admin/profile?error=Failed to update profile');
  }
});

// Change Admin Password - POST
router.post('/profile/change-password', async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    // Validate inputs
    if (!current_password || !new_password || !confirm_password) {
      return res.redirect('/admin/profile?error=All password fields are required');
    }

    if (new_password !== confirm_password) {
      return res.redirect('/admin/profile?error=New passwords do not match');
    }

    if (new_password.length < 6) {
      return res.redirect('/admin/profile?error=Password must be at least 6 characters long');
    }

    // Get current password from database
    const [users] = await db.pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.redirect('/admin/profile?error=User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.redirect('/admin/profile?error=Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    
    await db.pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    // Create admin activity log
    try {
      await db.pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [userId, 'Password Changed', 'Admin password was updated successfully.', 'security']
      );
    } catch (logError) {
      console.error('Failed to create notification:', logError);
    }

    res.redirect('/admin/profile?success=Password updated successfully');
  } catch (error) {
    console.error('Change admin password error:', error);
    res.redirect('/admin/profile?error=Failed to change password');
  }
});

// ======== USER MANAGEMENT ROUTES ========

// User Management - List
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.pool.execute(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, r.name as role, 
            u.is_active, u.created_at, t.name as team_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      LEFT JOIN teams t ON u.team_id = t.id 
      ORDER BY u.created_at DESC
    `);
    
    res.render('admin/users/list', {
      title: 'User Management - FinMate',
      user: req.user,
      users: users || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.render('admin/users/list', {
      title: 'User Management - FinMate',
      user: req.user,
      users: [],
      error: 'Failed to load users'
    });
  }
});

// Add User - GET
router.get('/users/add', async (req, res) => {
  try {
    const [roles] = await db.pool.execute('SELECT id, name FROM roles');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    res.render('admin/users/add', {
      title: 'Add User - FinMate',
      user: req.user,
      roles: roles || [],
      teams: teams || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Add user form error:', error);
    res.render('admin/users/add', {
      title: 'Add User - FinMate',
      user: req.user,
      roles: [],
      teams: [],
      error: 'Failed to load form data'
    });
  }
});

// Add User - POST
router.post('/users/add', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role_id, team_id } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name || !role_id) {
      return res.redirect('/admin/users/add?error=All fields are required');
    }

    if (password.length < 6) {
      return res.redirect('/admin/users/add?error=Password must be at least 6 characters long');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    await db.pool.execute(
      'INSERT INTO users (username, email, password, first_name, last_name, role_id, team_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [username, email, hashedPassword, first_name, last_name, role_id, team_id || null]
    );
    
    res.redirect('/admin/users?success=User added successfully');
  } catch (error) {
    console.error('Add user error:', error);
    let errorMessage = 'Failed to add user';
    
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Username or email already exists';
    }
    
    res.redirect(`/admin/users/add?error=${encodeURIComponent(errorMessage)}`);
  }
});

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
      return res.redirect('/admin/users?error=User not found');
    }
    
    const [roles] = await db.pool.execute('SELECT id, name FROM roles');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    // Get user analytics data
    const userId = req.params.id;
    
    // Expense statistics
    const [expenseStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM expenses 
      WHERE user_id = ?
    `, [userId]);

    // Budget statistics
    const [budgetStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount
      FROM budgets 
      WHERE user_id = ?
    `, [userId]);

    // Savings goals statistics
    const [savingsStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_count,
        SUM(target_amount) as total_target,
        SUM(current_amount) as total_saved
      FROM savings_goals 
      WHERE user_id = ?
    `, [userId]);

    // Notification statistics
    const [notificationStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread_count
      FROM notifications 
      WHERE user_id = ?
    `, [userId]);

    // Recent expenses (last 5)
    const [recentExpenses] = await db.pool.execute(`
      SELECT description, amount, date, status, category
      FROM expenses 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);

    // Recent budgets (last 3)
    const [recentBudgets] = await db.pool.execute(`
      SELECT category, amount, period
      FROM budgets 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 3
    `, [userId]);

    const userAnalytics = {
      expenses: {
        total: expenseStats[0]?.total_count || 0,
        totalAmount: expenseStats[0]?.total_amount || 0,
        pending: expenseStats[0]?.pending_count || 0
      },
      budgets: {
        total: budgetStats[0]?.total_count || 0,
        totalAmount: budgetStats[0]?.total_amount || 0
      },
      savings: {
        total: savingsStats[0]?.total_count || 0,
        totalTarget: savingsStats[0]?.total_target || 0,
        totalSaved: savingsStats[0]?.total_saved || 0
      },
      notifications: {
        total: notificationStats[0]?.total_count || 0,
        unread: notificationStats[0]?.unread_count || 0
      },
      recentExpenses: recentExpenses || [],
      recentBudgets: recentBudgets || []
    };
    
    res.render('admin/users/edit', {
      title: 'Edit User - FinMate',
      user: req.user,
      userData: users[0],
      roles: roles || [],
      teams: teams || [],
      userAnalytics: userAnalytics,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Edit user form error:', error);
    res.redirect('/admin/users?error=Failed to load user');
  }
});

// Edit User - POST
router.post('/users/edit/:id', async (req, res) => {
  try {
    const { username, email, first_name, last_name, role_id, team_id, is_active } = req.body;
    
    // Validate required fields
    if (!username || !email || !first_name || !last_name || !role_id) {
      return res.redirect(`/admin/users/edit/${req.params.id}?error=All fields are required`);
    }

    await db.pool.execute(
      'UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ?, role_id = ?, team_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, email, first_name, last_name, role_id, team_id || null, is_active ? 1 : 0, req.params.id]
    );
    
    res.redirect(`/admin/users/edit/${req.params.id}?success=User updated successfully`);
  } catch (error) {
    console.error('Edit user error:', error);
    let errorMessage = 'Failed to update user';
    
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Username or email already exists';
    }
    
    res.redirect(`/admin/users/edit/${req.params.id}?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Change User Password - POST
router.post('/users/change-password/:id', async (req, res) => {
  try {
    const { new_password, confirm_password } = req.body;
    const userId = req.params.id;

    // Validate passwords
    if (!new_password) {
      return res.redirect(`/admin/users/edit/${userId}?error=New password is required`);
    }

    if (new_password !== confirm_password) {
      return res.redirect(`/admin/users/edit/${userId}?error=Passwords do not match`);
    }

    if (new_password.length < 6) {
      return res.redirect(`/admin/users/edit/${userId}?error=Password must be at least 6 characters long`);
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(new_password, 12);
    
    await db.pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    // Create notification for the user about password change
    try {
      await db.pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [userId, 'Password Changed', 'Your password was changed by an administrator.', 'security']
      );
    } catch (logError) {
      console.error('Failed to create notification:', logError);
    }
    
    res.redirect(`/admin/users/edit/${userId}?success=Password updated successfully`);
  } catch (error) {
    console.error('Change password error:', error);
    res.redirect(`/admin/users/edit/${userId}?error=Failed to update password`);
  }
});

// Delete User - POST
router.post('/users/delete/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.redirect('/admin/users?success=User deactivated successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    res.redirect('/admin/users?error=Failed to deactivate user');
  }
});

// ======== USER API ENDPOINTS ========

// User statistics API
router.get('/api/users/:id/statistics', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get comprehensive statistics
    const [expenseData] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_expenses,
        SUM(amount) as total_expense_amount,
        AVG(amount) as avg_expense_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses
      FROM expenses 
      WHERE user_id = ?
    `, [userId]);

    const [budgetData] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_budgets,
        SUM(amount) as total_budget_amount,
        AVG(amount) as avg_budget_amount
      FROM budgets 
      WHERE user_id = ?
    `, [userId]);

    const [savingsData] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_goals,
        SUM(target_amount) as total_target,
        SUM(current_amount) as total_saved,
        AVG(current_amount / target_amount * 100) as avg_progress
      FROM savings_goals 
      WHERE user_id = ? AND status = 'active'
    `, [userId]);

    const [recentActivity] = await db.pool.execute(`
      (SELECT 'expense' as type, description, amount, date as activity_date, status
      FROM expenses WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'budget' as type, category as description, amount, start_date as activity_date, 'active' as status
      FROM budgets WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 3)
      ORDER BY activity_date DESC LIMIT 8
    `, [userId, userId]);

    res.json({
      success: true,
      statistics: {
        expenses: expenseData[0] || {},
        budgets: budgetData[0] || {},
        savings: savingsData[0] || {},
        recentActivity: recentActivity || []
      }
    });
  } catch (error) {
    console.error('User statistics API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user statistics' 
    });
  }
});

// User activity API
router.get('/api/users/:id/activity', async (req, res) => {
  try {
    const userId = req.params.id;
    const { limit = 20 } = req.query;

    // Get comprehensive activity from multiple tables
    const [activities] = await db.pool.execute(`
      (SELECT 
        'expense_created' as activity_type,
        CONCAT('Created expense: ', description) as description,
        amount,
        created_at as activity_date,
        NULL as admin_id
      FROM expenses WHERE user_id = ?)
      
      UNION ALL
      
      (SELECT 
        'budget_created' as activity_type,
        CONCAT('Created budget: ', category) as description,
        amount,
        created_at as activity_date,
        NULL as admin_id
      FROM budgets WHERE user_id = ?)
      
      UNION ALL
      
      (SELECT 
        'savings_goal_created' as activity_type,
        CONCAT('Created savings goal: ', name) as description,
        target_amount as amount,
        created_at as activity_date,
        NULL as admin_id
      FROM savings_goals WHERE user_id = ?)
      
      ORDER BY activity_date DESC 
      LIMIT ?
    `, [userId, userId, userId, parseInt(limit)]);

    res.json({
      success: true,
      activities: activities || []
    });
  } catch (error) {
    console.error('User activity API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user activity' 
    });
  }
});

// ======== BUDGET MANAGEMENT ROUTES ========

// Budget Management - List
router.get('/budgets', async (req, res) => {
  try {
    const [budgets] = await db.pool.execute(`
      SELECT b.*, u.username as user_name, t.name as team_name 
      FROM budgets b 
      LEFT JOIN users u ON b.user_id = u.id 
      LEFT JOIN teams t ON b.team_id = t.id 
      ORDER BY b.created_at DESC
    `);
    
    res.render('admin/budgets/list', {
      title: 'Budget Management - FinMate',
      user: req.user,
      budgets: budgets || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Budgets list error:', error);
    res.render('admin/budgets/list', {
      title: 'Budget Management - FinMate',
      user: req.user,
      budgets: [],
      error: 'Failed to load budgets'
    });
  }
});

// Create Budget - GET
router.get('/budgets/create', async (req, res) => {
  try {
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    res.render('admin/budgets/create', {
      title: 'Create Budget - FinMate',
      user: req.user,
      users: users || [],
      teams: teams || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Create budget form error:', error);
    res.render('admin/budgets/create', {
      title: 'Create Budget - FinMate',
      user: req.user,
      users: [],
      teams: [],
      error: 'Failed to load form data'
    });
  }
});

// Create Budget - POST
router.post('/budgets/create', async (req, res) => {
  try {
    const { user_id, team_id, category, amount, period, start_date, end_date } = req.body;
    
    if (!user_id || !category || !amount || !period || !start_date) {
      return res.redirect('/admin/budgets/create?error=User, category, amount, period and start date are required');
    }
    
    await db.pool.execute(
      'INSERT INTO budgets (user_id, team_id, category, amount, period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, team_id || null, category, parseFloat(amount), period, start_date, end_date || null]
    );
    
    res.redirect('/admin/budgets?success=Budget created successfully');
  } catch (error) {
    console.error('Create budget error:', error);
    let errorMessage = 'Failed to create budget';
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database column error. Please check the table structure.';
    }
    
    res.redirect(`/admin/budgets/create?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Edit Budget - GET
router.get('/budgets/edit/:id', async (req, res) => {
  try {
    const [budgets] = await db.pool.execute('SELECT * FROM budgets WHERE id = ?', [req.params.id]);
    
    if (budgets.length === 0) {
      return res.redirect('/admin/budgets?error=Budget not found');
    }
    
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    res.render('admin/budgets/edit', {
      title: 'Edit Budget - FinMate',
      user: req.user,
      budget: budgets[0],
      users: users || [],
      teams: teams || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Edit budget form error:', error);
    res.redirect('/admin/budgets?error=Failed to load budget');
  }
});

// Edit Budget - POST
router.post('/budgets/edit/:id', async (req, res) => {
  try {
    const { user_id, team_id, category, amount, period, start_date, end_date } = req.body;
    
    if (!user_id || !category || !amount || !period || !start_date) {
      return res.redirect(`/admin/budgets/edit/${req.params.id}?error=All required fields must be filled`);
    }

    await db.pool.execute(
      'UPDATE budgets SET user_id = ?, team_id = ?, category = ?, amount = ?, period = ?, start_date = ?, end_date = ? WHERE id = ?',
      [user_id, team_id || null, category, parseFloat(amount), period, start_date, end_date || null, req.params.id]
    );
    
    res.redirect('/admin/budgets?success=Budget updated successfully');
  } catch (error) {
    console.error('Edit budget error:', error);
    res.redirect(`/admin/budgets/edit/${req.params.id}?error=Failed to update budget`);
  }
});

// Delete Budget - POST
router.post('/budgets/delete/:id', async (req, res) => {
  try {
    await db.pool.execute('DELETE FROM budgets WHERE id = ?', [req.params.id]);
    res.redirect('/admin/budgets?success=Budget deleted successfully');
  } catch (error) {
    console.error('Delete budget error:', error);
    res.redirect('/admin/budgets?error=Failed to delete budget');
  }
});

// ======== EXPENSE MANAGEMENT ROUTES ========

// Expense Management - List
router.get('/expenses', async (req, res) => {
  try {
    const { status } = req.query;
    const currentFilter = status || '';
    
    let query = `
      SELECT e.*, u.username, t.name as team_name 
      FROM expenses e 
      LEFT JOIN users u ON e.user_id = u.id 
      LEFT JOIN teams t ON e.team_id = t.id 
    `;
    
    let queryParams = [];
    
    // Add status filter if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ' WHERE e.status = ?';
      queryParams.push(status);
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    const [expenses] = await db.pool.execute(query, queryParams);
    
    // Helper function for status icons
    const getStatusIcon = (status) => {
      switch(status) {
        case 'pending': return 'clock';
        case 'approved': return 'check-circle';
        case 'rejected': return 'times-circle';
        default: return 'question-circle';
      }
    };
    
    res.render('admin/expenses/list', {
      title: 'Expense Management - FinMate',
      user: req.user,
      expenses: expenses || [],
      currentFilter: currentFilter,
      getStatusIcon: getStatusIcon,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Expenses list error:', error);
    res.render('admin/expenses/list', {
      title: 'Expense Management - FinMate',
      user: req.user,
      expenses: [],
      currentFilter: '',
      getStatusIcon: () => 'question-circle',
      error: 'Failed to load expenses'
    });
  }
});

// Add Expense - GET
router.get('/expenses/add', async (req, res) => {
  try {
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    res.render('admin/expenses/add', {
      title: 'Add Expense - FinMate',
      user: req.user,
      users: users || [],
      teams: teams || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Add expense form error:', error);
    res.render('admin/expenses/add', {
      title: 'Add Expense - FinMate',
      user: req.user,
      users: [],
      teams: [],
      error: 'Failed to load form data'
    });
  }
});

// Add Expense - POST
router.post('/expenses/add', async (req, res) => {
  try {
    const { user_id, team_id, amount, description, category, date, status } = req.body;
    
    if (!user_id || !amount || !description || !category || !date) {
      return res.redirect('/admin/expenses/add?error=All required fields must be filled');
    }

    await db.pool.execute(
      'INSERT INTO expenses (user_id, team_id, amount, description, category, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, team_id || null, amount, description, category, date, status || 'pending']
    );
    
    res.redirect('/admin/expenses?success=Expense added successfully');
  } catch (error) {
    console.error('Add expense error:', error);
    res.redirect('/admin/expenses/add?error=Failed to add expense');
  }
});

// Edit Expense - GET
router.get('/expenses/edit/:id', async (req, res) => {
  try {
    const [expenses] = await db.pool.execute('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1');
    const [teams] = await db.pool.execute('SELECT id, name FROM teams');
    
    if (expenses.length === 0) {
      return res.redirect('/admin/expenses?error=Expense not found');
    }
    
    res.render('admin/expenses/edit', {
      title: 'Edit Expense - FinMate',
      user: req.user,
      expense: expenses[0],
      users: users || [],
      teams: teams || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Edit expense form error:', error);
    res.redirect('/admin/expenses?error=Failed to load expense');
  }
});

// Edit Expense - POST
router.post('/expenses/edit/:id', async (req, res) => {
  try {
    const { user_id, team_id, amount, description, category, date, status } = req.body;
    
    if (!user_id || !amount || !description || !category || !date || !status) {
      return res.redirect(`/admin/expenses/edit/${req.params.id}?error=All required fields must be filled`);
    }

    await db.pool.execute(
      'UPDATE expenses SET user_id = ?, team_id = ?, amount = ?, description = ?, category = ?, date = ?, status = ? WHERE id = ?',
      [user_id, team_id || null, amount, description, category, date, status, req.params.id]
    );
    
    res.redirect('/admin/expenses?success=Expense updated successfully');
  } catch (error) {
    console.error('Edit expense error:', error);
    res.redirect(`/admin/expenses/edit/${req.params.id}?error=Failed to update expense`);
  }
});

// Delete Expense - POST
router.post('/expenses/delete/:id', async (req, res) => {
  try {
    await db.pool.execute('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.redirect('/admin/expenses?success=Expense deleted successfully');
  } catch (error) {
    console.error('Delete expense error:', error);
    res.redirect('/admin/expenses?error=Failed to delete expense');
  }
});

// Approve Expense - POST
router.post('/expenses/approve/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE expenses SET status = "approved" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/expenses?success=Expense approved successfully');
  } catch (error) {
    console.error('Approve expense error:', error);
    res.redirect('/admin/expenses?error=Failed to approve expense');
  }
});

// Reject Expense - POST
router.post('/expenses/reject/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE expenses SET status = "rejected" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/expenses?success=Expense rejected successfully');
  } catch (error) {
    console.error('Reject expense error:', error);
    res.redirect('/admin/expenses?error=Failed to reject expense');
  }
});

// ======== TEAM MANAGEMENT ROUTES ========

// Teams Management - List
router.get('/teams', async (req, res) => {
  try {
    const [teams] = await db.pool.execute(`
      SELECT t.*, u.username as leader_name 
      FROM teams t 
      LEFT JOIN users u ON t.team_leader_id = u.id 
      ORDER BY t.created_at DESC
    `);
    
    res.render('admin/teams/list', {
      title: 'Team Management - FinMate',
      user: req.user,
      teams: teams || [],
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Teams list error:', error);
    res.render('admin/teams/list', {
      title: 'Team Management - FinMate',
      user: req.user,
      teams: [],
      error: 'Failed to load teams'
    });
  }
});

// Create Team - GET
router.get('/teams/create', async (req, res) => {
  try {
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1 AND role_id IN (3, 4)');
    res.render('admin/teams/create', {
      title: 'Create Team - FinMate',
      user: req.user,
      users: users || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Create team form error:', error);
    res.redirect('/admin/teams?error=Failed to load create team form');
  }
});

// Create Team - POST
router.post('/teams/create', async (req, res) => {
  try {
    const { name, description, team_leader_id } = req.body;
    
    if (!name) {
      return res.redirect('/admin/teams/create?error=Team name is required');
    }

    await db.pool.execute(
      'INSERT INTO teams (name, description, team_leader_id) VALUES (?, ?, ?)',
      [name, description, team_leader_id || null]
    );
    
    res.redirect('/admin/teams?success=Team created successfully');
  } catch (error) {
    console.error('Create team error:', error);
    res.redirect('/admin/teams/create?error=Failed to create team');
  }
});

// Edit Team - GET
router.get('/teams/edit/:id', async (req, res) => {
  try {
    const [teams] = await db.pool.execute('SELECT * FROM teams WHERE id = ?', [req.params.id]);
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1 AND role_id IN (3, 4)');
    
    if (teams.length === 0) {
      return res.redirect('/admin/teams?error=Team not found');
    }
    
    res.render('admin/teams/edit', {
      title: 'Edit Team - FinMate',
      user: req.user,
      team: teams[0],
      users: users || [],
      error: req.query.error
    });
  } catch (error) {
    console.error('Edit team form error:', error);
    res.redirect('/admin/teams?error=Failed to load team');
  }
});

// Edit Team - POST
router.post('/teams/edit/:id', async (req, res) => {
  try {
    const { name, description, team_leader_id } = req.body;
    
    if (!name) {
      return res.redirect(`/admin/teams/edit/${req.params.id}?error=Team name is required`);
    }

    await db.pool.execute(
      'UPDATE teams SET name = ?, description = ?, team_leader_id = ? WHERE id = ?',
      [name, description, team_leader_id || null, req.params.id]
    );
    
    res.redirect('/admin/teams?success=Team updated successfully');
  } catch (error) {
    console.error('Edit team error:', error);
    res.redirect(`/admin/teams/edit/${req.params.id}?error=Failed to update team`);
  }
});

// Delete Team - POST
router.post('/teams/delete/:id', async (req, res) => {
  try {
    await db.pool.execute('DELETE FROM teams WHERE id = ?', [req.params.id]);
    res.redirect('/admin/teams?success=Team deleted successfully');
  } catch (error) {
    console.error('Delete team error:', error);
    res.redirect('/admin/teams?error=Failed to delete team');
  }
});

// ======== REPORTS & ANALYTICS ROUTES ========

// Reports & Analytics
router.get('/reports', async (req, res) => {
  try {
    console.log('📊 Loading reports data...');
    
    // Get financial statistics
    const [expenseStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_expenses,
        SUM(amount) as total_expense_amount,
        AVG(amount) as avg_expense_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_expenses,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_expenses,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_expenses
      FROM expenses
    `);

    const [budgetStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_budgets,
        SUM(amount) as total_budget_amount,
        AVG(amount) as avg_budget_amount,
        COUNT(CASE WHEN period = 'Daily' THEN 1 END) as daily_budgets,
        COUNT(CASE WHEN period = 'Weekly' THEN 1 END) as weekly_budgets,
        COUNT(CASE WHEN period = 'Monthly' THEN 1 END) as monthly_budgets,
        COUNT(CASE WHEN period = 'Yearly' THEN 1 END) as yearly_budgets
      FROM budgets
    `);

    // User statistics
    const [userStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role_id = 1 THEN 1 END) as admin_users,
        COUNT(CASE WHEN role_id = 2 THEN 1 END) as regular_users
      FROM users
    `);

    // Team statistics
    const [teamStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_teams,
        COUNT(CASE WHEN team_leader_id IS NOT NULL THEN 1 END) as teams_with_leaders
      FROM teams
    `);

    // Recent activity (last 7 days)
    const [recentActivity] = await db.pool.execute(`
      (SELECT 'expense' as type, description, amount, created_at, user_id
      FROM expenses 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC LIMIT 10)
      UNION ALL
      (SELECT 'budget' as type, category as description, amount, created_at, user_id
      FROM budgets 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC LIMIT 10)
      ORDER BY created_at DESC LIMIT 15
    `);

    // Monthly expense trend (last 6 months)
    const [monthlyTrend] = await db.pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as expense_count,
        SUM(amount) as total_amount
      FROM expenses 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);

    // Category-wise expenses
    const [categoryExpenses] = await db.pool.execute(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM expenses 
      WHERE status = 'approved'
      GROUP BY category
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    // Top users by expenses
    const [topUsers] = await db.pool.execute(`
      SELECT 
        u.username,
        COUNT(e.id) as expense_count,
        SUM(e.amount) as total_spent
      FROM users u
      LEFT JOIN expenses e ON u.id = e.user_id
      WHERE e.status = 'approved'
      GROUP BY u.id, u.username
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    const reportsData = {
      expenseStats: expenseStats[0] || {},
      budgetStats: budgetStats[0] || {},
      userStats: userStats[0] || {},
      teamStats: teamStats[0] || {},
      recentActivity: recentActivity || [],
      monthlyTrend: monthlyTrend || [],
      categoryExpenses: categoryExpenses || [],
      topUsers: topUsers || []
    };

    console.log('✅ Reports data loaded successfully');

    res.render('admin/reports/list', {
      title: 'Reports & Analytics - FinMate',
      user: req.user,
      reports: reportsData,
      currentPage: 'reports'
    });

  } catch (error) {
    console.error('❌ Reports error:', error);
    
    // Fallback data
    const fallbackData = {
      expenseStats: {},
      budgetStats: {},
      userStats: {},
      teamStats: {},
      recentActivity: [],
      monthlyTrend: [],
      categoryExpenses: [],
      topUsers: []
    };

    res.render('admin/reports/list', {
      title: 'Reports & Analytics - FinMate',
      user: req.user,
      reports: fallbackData,
      currentPage: 'reports',
      error: 'Failed to load reports data'
    });
  }
});

// Export Reports
router.get('/reports/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // Get data for export
    const [expenses] = await db.pool.execute(`
      SELECT e.*, u.username, t.name as team_name 
      FROM expenses e 
      LEFT JOIN users u ON e.user_id = u.id 
      LEFT JOIN teams t ON e.team_id = t.id 
      ORDER BY e.created_at DESC
    `);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses-report.csv');
      
      // Simple CSV header
      let csv = 'ID,Description,Amount,Category,Status,User,Team,Date\n';
      expenses.forEach(expense => {
        csv += `"${expense.id}","${expense.description}","${expense.amount}","${expense.category}","${expense.status}","${expense.username}","${expense.team_name}","${expense.date}"\n`;
      });
      
      return res.send(csv);
    } else {
      res.json({
        success: true,
        data: expenses,
        total: expenses.length
      });
    }
  } catch (error) {
    console.error('Export reports error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export reports' 
    });
  }
});

// ======== NOTIFICATIONS ROUTES ========

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const [notifications] = await db.pool.execute(`
      SELECT n.*, u.username 
      FROM notifications n 
      LEFT JOIN users u ON n.user_id = u.id 
      ORDER BY n.created_at DESC
    `);
    
    // Helper functions
    const getNotificationIcon = (type) => {
      switch(type) {
        case 'system': return 'server';
        case 'security': return 'shield-alt';
        case 'user': return 'users';
        case 'expense': return 'money-bill-wave';
        case 'budget': return 'chart-pie';
        default: return 'bell';
      }
    };
    
    const getNotificationColor = (type) => {
      switch(type) {
        case 'system': return 'secondary';
        case 'security': return 'danger';
        case 'user': return 'success';
        case 'expense': return 'info';
        case 'budget': return 'warning';
        default: return 'primary';
      }
    };
    
    const timeAgo = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      return date.toLocaleDateString();
    };
    
    res.render('admin/notifications/list', {
      title: 'Notifications - FinMate',
      user: req.user,
      notifications: notifications || [],
      getNotificationIcon,
      getNotificationColor,
      timeAgo,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    res.render('admin/notifications/list', {
      title: 'Notifications - FinMate',
      user: req.user,
      notifications: [],
      error: 'Failed to load notifications'
    });
  }
});

// ======== SYSTEM ADMIN ROUTES (Super Admin only) ========

// System Settings (Super Admin only)
router.get('/system-settings', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.redirect('/admin/dashboard?error=Access denied');
  }
  
  try {
    res.render('admin/system/settings', {
      title: 'System Settings - FinMate',
      user: req.user
    });
  } catch (error) {
    console.error('System settings error:', error);
    res.redirect('/admin/dashboard?error=Failed to load system settings');
  }
});

// Role Management (Super Admin only)
router.get('/role-management', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.redirect('/admin/dashboard?error=Access denied');
  }
  
  try {
    const [roles] = await db.pool.execute('SELECT * FROM roles ORDER BY id');
    res.render('admin/system/roles', {
      title: 'Role Management - FinMate',
      user: req.user,
      roles: roles || []
    });
  } catch (error) {
    console.error('Role management error:', error);
    res.redirect('/admin/dashboard?error=Failed to load role management');
  }
});

// Database Tools (Super Admin only)
router.get('/database', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.redirect('/admin/dashboard?error=Access denied');
  }
  
  try {
    res.render('admin/system/database', {
      title: 'Database Tools - FinMate',
      user: req.user
    });
  } catch (error) {
    console.error('Database tools error:', error);
    res.redirect('/admin/dashboard?error=Failed to load database tools');
  }
});

// ======== ADDITIONAL USER MANAGEMENT ROUTES ========

// User Activity Page - GET
router.get('/users/activity/:id', async (req, res) => {
  try {
    const [users] = await db.pool.execute(`
      SELECT u.*, r.name as role_name, t.name as team_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      LEFT JOIN teams t ON u.team_id = t.id 
      WHERE u.id = ?`, 
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.redirect('/admin/users?error=User not found');
    }

    const userData = users[0];

    // Get comprehensive activity data
    const [recentActivities] = await db.pool.execute(`
      (SELECT 
        'expense' as activity_type,
        description,
        amount,
        date as activity_date,
        status,
        created_at,
        NULL as category
      FROM expenses WHERE user_id = ?)
      
      UNION ALL
      
      (SELECT 
        'budget' as activity_type,
        category as description,
        amount,
        start_date as activity_date,
        'active' as status,
        created_at,
        category
      FROM budgets WHERE user_id = ?)
      
      UNION ALL
      
      (SELECT 
        'savings_goal' as activity_type,
        name as description,
        target_amount as amount,
        target_date as activity_date,
        status,
        created_at,
        NULL as category
      FROM savings_goals WHERE user_id = ?)
      
      ORDER BY created_at DESC 
      LIMIT 50
    `, [req.params.id, req.params.id, req.params.id]);

    // Get financial statistics
    const [expenseStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
      FROM expenses 
      WHERE user_id = ?
    `, [req.params.id]);

    const [budgetStats] = await db.pool.execute(`
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount
      FROM budgets 
      WHERE user_id = ?
    `, [req.params.id]);

    res.render('admin/users/activity', {
      title: 'User Activity - FinMate',
      user: req.user,
      userData: userData,
      activities: recentActivities || [],
      statistics: {
        expenses: expenseStats[0] || {},
        budgets: budgetStats[0] || {}
      },
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('User activity page error:', error);
    res.redirect('/admin/users?error=Failed to load user activity');
  }
});

// Change Password Page - GET
router.get('/users/change-password/:id', async (req, res) => {
  try {
    const [users] = await db.pool.execute(`
      SELECT u.*, r.name as role_name, t.name as team_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      LEFT JOIN teams t ON u.team_id = t.id 
      WHERE u.id = ?`, 
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.redirect('/admin/users?error=User not found');
    }

    const userData = users[0];

    res.render('admin/users/change-password', {
      title: 'Change Password - FinMate',
      user: req.user,
      userData: userData,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Change password page error:', error);
    res.redirect('/admin/users?error=Failed to load password change page');
  }
});

// ======== TEST ROUTE ========

// Test API route
router.get('/test', (req, res) => {
  res.json({
    message: 'Admin Routes - WORKING!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;