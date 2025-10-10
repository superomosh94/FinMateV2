const db = require('../../config/db');

const expenseController = {
  getExpenses: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get team ID for the team leader
      const [teams] = await db.pool.execute(
        'SELECT id FROM teams WHERE team_leader_id = ?',
        [userId]
      );

      if (teams.length === 0) {
        return res.render('teamLeader/expenses/index', {
          title: 'Team Expenses - FinMate',
          expenses: [],
          user: req.user,
          categories: require('../../config/appConfig').EXPENSE_CATEGORIES
        });
      }

      const teamId = teams[0].id;

      const [expenses] = await db.pool.execute(
        `SELECT e.*, u.username, u.first_name, u.last_name 
         FROM expenses e 
         JOIN users u ON e.user_id = u.id 
         WHERE e.team_id = ? 
         ORDER BY e.created_at DESC`,
        [teamId]
      );

      res.render('teamLeader/expenses/index', {
        title: 'Team Expenses - FinMate',
        expenses,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    } catch (error) {
      console.error('Get team expenses error:', error);
      res.render('teamLeader/expenses/index', {
        title: 'Team Expenses - FinMate',
        expenses: [],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    }
  },

  approveExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      const userId = req.user.id;

      // Verify the expense belongs to team leader's team
      const [expenses] = await db.pool.execute(
        `SELECT e.* FROM expenses e 
         JOIN teams t ON e.team_id = t.id 
         WHERE e.id = ? AND t.team_leader_id = ?`,
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        return res.status(403).json({ success: false, message: 'Not authorized to approve this expense' });
      }

      await db.pool.execute('UPDATE expenses SET status = "approved" WHERE id = ?', [expenseId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Expense approved successfully' });
      }
      
      res.redirect('/team-leader/expenses');
    } catch (error) {
      console.error('Approve expense error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error approving expense' });
      }
      
      res.redirect('/team-leader/expenses');
    }
  },

  rejectExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      const userId = req.user.id;

      // Verify the expense belongs to team leader's team
      const [expenses] = await db.pool.execute(
        `SELECT e.* FROM expenses e 
         JOIN teams t ON e.team_id = t.id 
         WHERE e.id = ? AND t.team_leader_id = ?`,
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        return res.status(403).json({ success: false, message: 'Not authorized to reject this expense' });
      }

      await db.pool.execute('UPDATE expenses SET status = "rejected" WHERE id = ?', [expenseId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Expense rejected successfully' });
      }
      
      res.redirect('/team-leader/expenses');
    } catch (error) {
      console.error('Reject expense error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error rejecting expense' });
      }
      
      res.redirect('/team-leader/expenses');
    }
  }
};

module.exports = expenseController;