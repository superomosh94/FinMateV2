// controllers/admin/dashboardController.js
const db = require('../../config/db');

const getDashboard = async (req, res) => {
  try {
    console.log('👑 Admin dashboard accessed by:', req.user.email, 'Role:', req.user.role_name);
    
    // Get dashboard statistics
    const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    const [budgetCount] = await db.pool.execute('SELECT COUNT(*) as count FROM budgets');
    const [expenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses');
    const [teamCount] = await db.pool.execute('SELECT COUNT(*) as count FROM teams WHERE is_active = TRUE');
    const [pendingExpenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses WHERE status = "pending"');
    const [notificationCount] = await db.pool.execute('SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE');
    
    // Get recent users
    const [recentUsers] = await db.pool.execute(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.is_active = TRUE 
      ORDER BY u.created_at DESC 
      LIMIT 5
    `);
    
    // Get recent expenses
    const [recentExpenses] = await db.pool.execute(`
      SELECT e.*, u.username 
      FROM expenses e 
      LEFT JOIN users u ON e.user_id = u.id 
      ORDER BY e.created_at DESC 
      LIMIT 5
    `);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - FinMate',
      user: req.user,
      stats: {
        totalUsers: userCount[0].count,
        totalBudgets: budgetCount[0].count,
        totalExpenses: expenseCount[0].count,
        totalTeams: teamCount[0].count,
        pendingExpenses: pendingExpenseCount[0].count,
        pendingNotifications: notificationCount[0].count
      },
      recentUsers: recentUsers,
      recentExpenses: recentExpenses
    });
  } catch (error) {
    console.error('💥 Admin dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - FinMate',
      user: req.user,
      stats: {
        totalUsers: 0,
        totalBudgets: 0,
        totalExpenses: 0,
        totalTeams: 0,
        pendingExpenses: 0,
        pendingNotifications: 0
      },
      recentUsers: [],
      recentExpenses: []
    });
  }
};

module.exports = {
  getDashboard
};