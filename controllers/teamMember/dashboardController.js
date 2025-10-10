const db = require('../../config/db');

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get team information
      const [teams] = await db.pool.execute(
        `SELECT t.*, u.username as leader_name 
         FROM teams t 
         JOIN users u ON t.team_leader_id = u.id 
         WHERE t.id = (SELECT team_id FROM users WHERE id = ?)`,
        [userId]
      );
      
      const team = teams[0];

      // Get personal statistics
      const [expenseCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?',
        [userId]
      );

      const [pendingExpenseCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM expenses WHERE user_id = ? AND status = "pending"',
        [userId]
      );

      const [totalExpenses] = await db.pool.execute(
        'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND status = "approved"',
        [userId]
      );

      const [plannedExpenseCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM planned_expenses WHERE user_id = ?',
        [userId]
      );

      // Get recent personal expenses
      const [recentExpenses] = await db.pool.execute(
        `SELECT e.* 
         FROM expenses e 
         WHERE e.user_id = ? 
         ORDER BY e.created_at DESC 
         LIMIT 5`,
        [userId]
      );

      res.render('teamMember/dashboard', {
        title: 'Team Member Dashboard - FinMate',
        user: req.user,
        team,
        stats: {
          myExpenses: expenseCount[0].count,
          pendingExpenses: pendingExpenseCount[0].count,
          totalSpent: totalExpenses[0].total || 0,
          plannedExpenses: plannedExpenseCount[0].count
        },
        recentExpenses
      });
    } catch (error) {
      console.error('Team member dashboard error:', error);
      res.render('teamMember/dashboard', {
        title: 'Team Member Dashboard - FinMate',
        user: req.user,
        team: null,
        stats: {},
        recentExpenses: []
      });
    }
  }
};

module.exports = dashboardController;