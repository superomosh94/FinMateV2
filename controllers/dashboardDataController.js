const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const db = require('../config/db');
const expenseService = require('../services/expenseService'); // adjust path if needed

const router = express.Router();

// Dashboard data function using expenseService
const getDashboardData = async (userId) => {
  try {
    // Get expenses via service
    const expenses = await expenseService.getUserExpenses(userId);

    // Total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    // Recent transaction (first one)
    const recentTransactions = expenses[0] || {};

    // Active budgets (single object)
    const [activeBudgetsRows] = await db.query(
      `SELECT b.id, b.category, b.amount,
              COALESCE(SUM(e.amount),0) AS spent
       FROM budgets b
       LEFT JOIN expenses e 
         ON e.user_id = b.user_id AND e.category = b.category 
           AND MONTH(e.created_at) = MONTH(CURRENT_DATE())
           AND YEAR(e.created_at) = YEAR(CURRENT_DATE())
       WHERE b.user_id = ?
       GROUP BY b.id, b.category, b.amount
       LIMIT 1`,
      [userId]
    );

    // Planned future expenses
    const [plannedRows] = await db.query(
      `SELECT COUNT(*) AS plannedExpenses 
       FROM planned_expenses 
       WHERE user_id = ? AND planned_date >= CURDATE()`,
      [userId]
    );

    // Active savings goal (single object)
    const [savingsGoalsRows] = await db.query(
      `SELECT id, name, target_amount, current_amount, target_date, status
       FROM savings_goals
       WHERE user_id = ? AND status='active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    // Notification count
    const [notificationRows] = await db.query(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return {
      totalExpenses: parseFloat(totalExpenses),
      totalSavings: 0, // optionally calculate if you have savings table
      recentTransactions,
      activeBudgets: activeBudgetsRows.length ? 1 : 0,
      activeBudgetsData: activeBudgetsRows[0] || {},
      plannedExpenses: plannedRows[0]?.plannedExpenses || 0,
      savingsGoals: savingsGoalsRows[0] || {},
      notificationCount: notificationRows[0]?.notificationCount || 0
    };

  } catch (error) {
    console.error('Dashboard data error:', error);
    return {
      totalExpenses: 0,
      totalSavings: 0,
      recentTransactions: {},
      activeBudgets: 0,
      activeBudgetsData: {},
      plannedExpenses: 0,
      savingsGoals: {},
      notificationCount: 0
    };
  }
};

// ---- /dashboard route ----
router.get('/dashboard', authenticate, requireRole('individual_user'), asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const data = await getDashboardData(userId);

  console.log('Dashboard data:', data); // debug

  res.render('individualUser/dashboard', {
    title: 'Personal Dashboard',
    user: req.user,
    currentPage: 'dashboard',
    data,
    notificationCount: data.notificationCount,
    success: req.query.success || false,
    message: req.query.message || '',
    error: req.query.error || ''
  });
}));

module.exports = router;
