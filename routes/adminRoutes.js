// routes/adminRoutes.js
const express = require('express');
const { authenticate, requireAnyRole } = require('../middlewares/authMiddleware');
const db = require('../config/db');

const router = express.Router();

// Apply authentication and authorization
router.use(authenticate);
router.use(requireAnyRole(['admin', 'super_admin']));

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const [budgetCount] = await db.pool.execute('SELECT COUNT(*) as count FROM budgets WHERE is_active = 1');
    const [expenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses WHERE deleted_at IS NULL');
    const [pendingExpenses] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses WHERE status = "pending" AND deleted_at IS NULL');
    const [teamCount] = await db.pool.execute('SELECT COUNT(*) as count FROM teams WHERE is_active = 1');
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
      stats: stats
    });
  } catch (error) {
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
      stats: stats
    });
  }
});

// User Management
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.pool.execute(`
      SELECT id, username, email, role, is_active, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    res.render('admin/users/list', {
      title: 'User Management - FinMate',
      user: req.user,
      users: users || []
    });
  } catch (error) {
    res.render('admin/users/list', {
      title: 'User Management - FinMate',
      user: req.user,
      users: []
    });
  }
});

router.get('/users/add', (req, res) => {
  res.render('admin/users/add', {
    title: 'Add User - FinMate',
    user: req.user
  });
});

router.post('/users/add', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    await db.pool.execute(
      'INSERT INTO users (username, email, password, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [username, email, password, role]
    );
    
    res.redirect('/admin/users?success=User added successfully');
  } catch (error) {
    res.redirect('/admin/users?error=Failed to add user');
  }
});

router.get('/users/edit/:id', async (req, res) => {
  try {
    const [users] = await db.pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (users.length === 0) {
      return res.redirect('/admin/users?error=User not found');
    }
    
    res.render('admin/users/edit', {
      title: 'Edit User - FinMate',
      user: req.user,
      userData: users[0]
    });
  } catch (error) {
    res.redirect('/admin/users?error=Failed to load user');
  }
});

router.post('/users/edit/:id', async (req, res) => {
  try {
    const { username, email, role, is_active } = req.body;
    
    await db.pool.execute(
      'UPDATE users SET username = ?, email = ?, role = ?, is_active = ? WHERE id = ?',
      [username, email, role, is_active ? 1 : 0, req.params.id]
    );
    
    res.redirect('/admin/users?success=User updated successfully');
  } catch (error) {
    res.redirect('/admin/users?error=Failed to update user');
  }
});

router.post('/users/delete/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.redirect('/admin/users?success=User deleted successfully');
  } catch (error) {
    res.redirect('/admin/users?error=Failed to delete user');
  }
});

// Budget Management
router.get('/budgets', async (req, res) => {
  try {
    const [budgets] = await db.pool.execute(`
      SELECT b.*, u.username as created_by_name 
      FROM budgets b 
      LEFT JOIN users u ON b.created_by = u.id 
      WHERE b.is_active = 1 
      ORDER BY b.created_at DESC
    `);
    
    res.render('admin/budgets/list', {
      title: 'Budget Management - FinMate',
      user: req.user,
      budgets: budgets || []
    });
  } catch (error) {
    res.render('admin/budgets/list', {
      title: 'Budget Management - FinMate',
      user: req.user,
      budgets: []
    });
  }
});

// Fix budgets table structure route
router.get('/fix-budgets-table', async (req, res) => {
  try {
    const [structure] = await db.pool.execute('DESCRIBE budgets');
    
    const missingColumns = [];
    
    const hasDescription = structure.some(col => col.Field === 'description');
    if (!hasDescription) {
      await db.pool.execute('ALTER TABLE budgets ADD COLUMN description TEXT');
      missingColumns.push('description');
    }
    
    if (missingColumns.length > 0) {
      res.json({ 
        success: true, 
        message: `Added missing columns: ${missingColumns.join(', ')}`,
        added_columns: missingColumns
      });
    } else {
      res.json({ 
        success: true, 
        message: 'All required columns already exist in budgets table'
      });
    }
    
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message,
      code: error.code 
    });
  }
});

// Check budgets columns route
router.get('/check-budgets-columns', async (req, res) => {
  try {
    const [columns] = await db.pool.execute('DESCRIBE budgets');
    res.json({
      table: 'budgets',
      columns: columns.map(col => col.Field)
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get('/budgets/create', (req, res) => {
  res.render('admin/budgets/create', {
    title: 'Create Budget - FinMate',
    user: req.user
  });
});

// FIXED: Budget create route with correct column names
router.post('/budgets/create', async (req, res) => {
  try {
    const { category, amount, period, description } = req.body;
    
    if (!category || !amount || !period) {
      return res.redirect('/admin/budgets/create?error=Category, amount and period are required');
    }
    
    await db.pool.execute(
      'INSERT INTO budgets (category, amount, period, description, created_by, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [category, parseFloat(amount), period, description || '', req.user.id]
    );
    
    res.redirect('/admin/budgets?success=Budget created successfully');
  } catch (error) {
    let errorMessage = 'Failed to create budget';
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database column error. Please check the table structure.';
    }
    
    res.redirect(`/admin/budgets/create?error=${encodeURIComponent(errorMessage)}`);
  }
});

router.get('/budgets/add', (req, res) => {
  res.render('admin/budgets/add', {
    title: 'Add Budget - FinMate',
    user: req.user
  });
});

// FIXED: Budget add route with correct column names
router.post('/budgets/add', async (req, res) => {
  try {
    const { category, amount, period, description } = req.body;
    
    await db.pool.execute(
      'INSERT INTO budgets (category, amount, period, description, created_by, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [category, parseFloat(amount), period, description || '', req.user.id]
    );
    
    res.redirect('/admin/budgets?success=Budget added successfully');
  } catch (error) {
    res.redirect('/admin/budgets/add?error=Failed to add budget');
  }
});

router.get('/budgets/edit/:id', async (req, res) => {
  try {
    const [budgets] = await db.pool.execute('SELECT * FROM budgets WHERE id = ? AND is_active = 1', [req.params.id]);
    
    if (budgets.length === 0) {
      return res.redirect('/admin/budgets?error=Budget not found');
    }
    
    res.render('admin/budgets/edit', {
      title: 'Edit Budget - FinMate',
      user: req.user,
      budget: budgets[0]
    });
  } catch (error) {
    res.redirect('/admin/budgets?error=Failed to load budget');
  }
});

// FIXED: Budget edit route with correct column names
router.post('/budgets/edit/:id', async (req, res) => {
  try {
    const { category, amount, period, description } = req.body;
    
    await db.pool.execute(
      'UPDATE budgets SET category = ?, amount = ?, period = ?, description = ? WHERE id = ?',
      [category, parseFloat(amount), period, description || '', req.params.id]
    );
    
    res.redirect('/admin/budgets?success=Budget updated successfully');
  } catch (error) {
    res.redirect('/admin/budgets?error=Failed to update budget');
  }
});

router.post('/budgets/delete/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE budgets SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.redirect('/admin/budgets?success=Budget deleted successfully');
  } catch (error) {
    res.redirect('/admin/budgets?error=Failed to delete budget');
  }
});

// REMOVED DUPLICATE ROUTES - These were duplicates of the routes above
// router.get('/budgets/edit/:id', async (req, res) => { ... });
// router.get('/budgets/delete/:id', async (req, res) => { ... });

// Expense Management
router.get('/expenses', async (req, res) => {
  try {
    const [expenses] = await db.pool.execute(`
      SELECT e.*, u.username, b.category as budget_category 
      FROM expenses e 
      LEFT JOIN users u ON e.user_id = u.id 
      LEFT JOIN budgets b ON e.budget_id = b.id 
      WHERE e.deleted_at IS NULL 
      ORDER BY e.created_at DESC
    `);
    
    res.render('admin/expenses/list', {
      title: 'Expense Management - FinMate',
      user: req.user,
      expenses: expenses || []
    });
  } catch (error) {
    res.render('admin/expenses/list', {
      title: 'Expense Management - FinMate',
      user: req.user,
      expenses: []
    });
  }
});

router.get('/expenses/add', async (req, res) => {
  try {
    const [budgets] = await db.pool.execute('SELECT id, category FROM budgets WHERE is_active = 1');
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1');
    
    res.render('admin/expenses/add', {
      title: 'Add Expense - FinMate',
      user: req.user,
      budgets: budgets || [],
      users: users || []
    });
  } catch (error) {
    res.render('admin/expenses/add', {
      title: 'Add Expense - FinMate',
      user: req.user,
      budgets: [],
      users: []
    });
  }
});

router.post('/expenses/add', async (req, res) => {
  try {
    const { user_id, budget_id, amount, description, date } = req.body;
    
    await db.pool.execute(
      'INSERT INTO expenses (user_id, budget_id, amount, description, expense_date, status) VALUES (?, ?, ?, ?, ?, "approved")',
      [user_id, budget_id, amount, description, date]
    );
    
    res.redirect('/admin/expenses?success=Expense added successfully');
  } catch (error) {
    res.redirect('/admin/expenses/add?error=Failed to add expense');
  }
});

router.get('/expenses/edit/:id', async (req, res) => {
  try {
    const [expenses] = await db.pool.execute('SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    const [budgets] = await db.pool.execute('SELECT id, category FROM budgets WHERE is_active = 1');
    const [users] = await db.pool.execute('SELECT id, username FROM users WHERE is_active = 1');
    
    if (expenses.length === 0) {
      return res.redirect('/admin/expenses?error=Expense not found');
    }
    
    res.render('admin/expenses/edit', {
      title: 'Edit Expense - FinMate',
      user: req.user,
      expense: expenses[0],
      budgets: budgets || [],
      users: users || []
    });
  } catch (error) {
    res.redirect('/admin/expenses?error=Failed to load expense');
  }
});

router.post('/expenses/edit/:id', async (req, res) => {
  try {
    const { user_id, budget_id, amount, description, date, status } = req.body;
    
    await db.pool.execute(
      'UPDATE expenses SET user_id = ?, budget_id = ?, amount = ?, description = ?, expense_date = ?, status = ? WHERE id = ?',
      [user_id, budget_id, amount, description, date, status, req.params.id]
    );
    
    res.redirect('/admin/expenses?success=Expense updated successfully');
  } catch (error) {
    res.redirect('/admin/expenses?error=Failed to update expense');
  }
});

router.post('/expenses/delete/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE expenses SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.redirect('/admin/expenses?success=Expense deleted successfully');
  } catch (error) {
    res.redirect('/admin/expenses?error=Failed to delete expense');
  }
});

router.post('/expenses/approve/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE expenses SET status = "approved" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/expenses?success=Expense approved successfully');
  } catch (error) {
    res.redirect('/admin/expenses?error=Failed to approve expense');
  }
});

router.post('/expenses/reject/:id', async (req, res) => {
  try {
    await db.pool.execute('UPDATE expenses SET status = "rejected" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/expenses?success=Expense rejected successfully');
  } catch (error) {
    res.redirect('/admin/expenses?error=Failed to reject expense');
  }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const [notifications] = await db.pool.execute(`
      SELECT n.*, u.username 
      FROM notifications n 
      LEFT JOIN users u ON n.user_id = u.id 
      ORDER BY n.created_at DESC
    `);
    
    res.render('admin/notifications/list', {
      title: 'Notifications - FinMate',
      user: req.user,
      notifications: notifications || []
    });
  } catch (error) {
    res.render('admin/notifications/list', {
      title: 'Notifications - FinMate',
      user: req.user,
      notifications: []
    });
  }
});

// Test API route
router.get('/test', (req, res) => {
  res.json({
    message: 'Admin Routes - WORKING!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;