const db = require('../../config/db');

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get team information
      const [teams] = await db.pool.execute(
        'SELECT * FROM teams WHERE team_leader_id = ?',
        [userId]
      );
      
      const team = teams[0];
      if (!team) {
        return res.render('teamLeader/dashboard', {
          title: 'Team Leader Dashboard - FinMate',
          user: req.user,
          team: null,
          stats: {},
          recentExpenses: []
        });
      }

      // Get team statistics
      const [memberCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE team_id = ? AND is_active = TRUE',
        [team.id]
      );

      const [expenseCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM expenses WHERE team_id = ?',
        [team.id]
      );

      const [pendingExpenseCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM expenses WHERE team_id = ? AND status = "pending"',
        [team.id]
      );

      const [budgetCount] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM budgets WHERE team_id = ?',
        [team.id]
      );

      // Get recent team expenses
      const [recentExpenses] = await db.pool.execute(
        `SELECT e.*, u.username, u.first_name, u.last_name 
         FROM expenses e 
         JOIN users u ON e.user_id = u.id 
         WHERE e.team_id = ? 
         ORDER BY e.created_at DESC 
         LIMIT 5`,
        [team.id]
      );

      res.render('teamLeader/dashboard', {
        title: 'Team Leader Dashboard - FinMate',
        user: req.user,
        team,
        stats: {
          teamMembers: memberCount[0].count,
          teamExpenses: expenseCount[0].count,
          pendingExpenses: pendingExpenseCount[0].count,
          teamBudgets: budgetCount[0].count
        },
        recentExpenses
      });
    } catch (error) {
      console.error('Team leader dashboard error:', error);
      res.render('teamLeader/dashboard', {
        title: 'Team Leader Dashboard - FinMate',
        user: req.user,
        team: null,
        stats: {},
        recentExpenses: []
      });
    }
  }
};

module.exports = dashboardController;