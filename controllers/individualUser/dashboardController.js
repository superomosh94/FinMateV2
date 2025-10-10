// controllers/individualUser/dashboardController.js
const db = require('../../config/db');

const getDashboard = async (req, res) => {
  try {
    console.log('👤 Individual user dashboard accessed by:', req.user.email);
    
    // Get dashboard statistics
    const [monthlyExpenses] = await db.pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE user_id = ? 
      AND MONTH(date) = MONTH(CURRENT_DATE()) 
      AND YEAR(date) = YEAR(CURRENT_DATE())
    `, [req.user.id]);
    
    const [totalSavings] = await db.pool.execute(`
      SELECT COALESCE(SUM(current_amount), 0) as total 
      FROM savings 
      WHERE user_id = ? AND is_active = TRUE
    `, [req.user.id]);
    
    const [activeBudgetsCount] = await db.pool.execute(`
      SELECT COUNT(*) as count 
      FROM budgets 
      WHERE user_id = ? AND is_active = TRUE
    `, [req.user.id]);
    
    const [plannedExpensesCount] = await db.pool.execute(`
      SELECT COUNT(*) as count 
      FROM planned_expenses 
      WHERE user_id = ? AND status != 'completed'
    `, [req.user.id]);
    
    const [unreadNotifications] = await db.pool.execute(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = FALSE
    `, [req.user.id]);
    
    // Get active budgets with progress
    const [activeBudgets] = await db.pool.execute(`
      SELECT b.*, 
             COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      LEFT JOIN expenses e ON b.id = e.budget_id 
      WHERE b.user_id = ? AND b.is_active = TRUE
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `, [req.user.id]);
    
    // Get savings goals
    const [savingsGoals] = await db.pool.execute(`
      SELECT * FROM savings 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY target_date ASC
      LIMIT 6
    `, [req.user.id]);
    
    // Get recent expenses
    const [recentExpenses] = await db.pool.execute(`
      SELECT * FROM expenses 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT 5
    `, [req.user.id]);
    
    // Get upcoming planned expenses
    const [upcomingPlannedExpenses] = await db.pool.execute(`
      SELECT * FROM planned_expenses 
      WHERE user_id = ? 
      AND status != 'completed'
      AND planned_date >= CURDATE()
      ORDER BY planned_date ASC 
      LIMIT 5
    `, [req.user.id]);

    res.render('individualUser/dashboard', {
      title: 'Personal Dashboard - FinMate',
      user: req.user,
      stats: {
        monthlyExpenses: monthlyExpenses[0].total,
        totalSavings: totalSavings[0].total,
        activeBudgets: activeBudgetsCount[0].count,
        plannedExpenses: plannedExpensesCount[0].count,
        unreadNotifications: unreadNotifications[0].count
      },
      activeBudgets: activeBudgets,
      savingsGoals: savingsGoals,
      recentExpenses: recentExpenses,
      upcomingPlannedExpenses: upcomingPlannedExpenses
    });
  } catch (error) {
    console.error('💥 Individual user dashboard error:', error);
    res.render('individualUser/dashboard', {
      title: 'Personal Dashboard - FinMate',
      user: req.user,
      stats: {
        monthlyExpenses: 0,
        totalSavings: 0,
        activeBudgets: 0,
        plannedExpenses: 0,
        unreadNotifications: 0
      },
      activeBudgets: [],
      savingsGoals: [],
      recentExpenses: [],
      upcomingPlannedExpenses: []
    });
  }
};

module.exports = {
  getDashboard
};