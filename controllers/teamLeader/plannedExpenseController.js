const db = require('../../config/db');

const plannedExpenseController = {
  getPlannedExpenses: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get team ID for the team leader
      const [teams] = await db.pool.execute(
        'SELECT id FROM teams WHERE team_leader_id = ?',
        [userId]
      );

      if (teams.length === 0) {
        return res.render('teamLeader/plannedExpenses/index', {
          title: 'Planned Expenses - FinMate',
          plannedExpenses: [],
          user: req.user,
          categories: require('../../config/appConfig').EXPENSE_CATEGORIES
        });
      }

      const teamId = teams[0].id;

      const [plannedExpenses] = await db.pool.execute(
        `SELECT pe.*, u.username, u.first_name, u.last_name 
         FROM planned_expenses pe 
         JOIN users u ON pe.user_id = u.id 
         WHERE pe.team_id = ? 
         ORDER BY pe.planned_date DESC`,
        [teamId]
      );

      res.render('teamLeader/plannedExpenses/index', {
        title: 'Planned Expenses - FinMate',
        plannedExpenses,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    } catch (error) {
      console.error('Get planned expenses error:', error);
      res.render('teamLeader/plannedExpenses/index', {
        title: 'Planned Expenses - FinMate',
        plannedExpenses: [],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    }
  }
};

module.exports = plannedExpenseController;