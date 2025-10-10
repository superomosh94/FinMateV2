const db = require('../../config/db');

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get personal statistics
      const [expenseCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?',
        [userId]
      );

      const [totalExpenses] = await db.pool.execute(
        'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND status = "approved"',
        [userId]
      );

      const [budgetCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM budgets WHERE user_id = ?',
        [userId]
      );

      const [savingsCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM savings WHERE user_id = ?',
        [userId]
      );

      const [savingsTotal] = await db.pool.execute(
        'SELECT SUM(current_amount) as total FROM savings WHERE user_id = ?',
        [userId]
      );

      // Get recent expenses
      const [recentExpenses] = await db.pool.execute(
        `SELECT e.* 
         FROM expenses e 
         WHERE e.user_id = ? 
         ORDER BY e.created_at DESC 
         LIMIT 5`,
        [userId]
      );

      // Get expense summary by category
      const [expenseSummary] = await db.pool.execute(
        `SELECT category, SUM(amount) as total, COUNT(*) as count 
         FROM expenses 
         WHERE user_id = ? AND status = 'approved'
         GROUP BY category 
         ORDER BY total DESC 
         LIMIT 5`,
        [userId]
      );

      res.render('individualUser/dashboard', {
        title: 'Dashboard - FinMate',
        user: req.user,
        stats: {
          totalExpenses: expenseCount[0].count,
          totalSpent: totalExpenses[0].total || 0,
          budgets: budgetCount[0].count,
          savingsGoals: savingsCount[0].count,
          totalSavings: savingsTotal[0].total || 0
        },
        recentExpenses,
        expenseSummary
      });
    } catch (error) {
      console.error('Individual user dashboard error:', error);
      res.render('individualUser/dashboard', {
        title: 'Dashboard - FinMate',
        user: req.user,
        stats: {},
        recentExpenses: [],
        expenseSummary: []
      });
    }
  }
};

module.exports = dashboardController;