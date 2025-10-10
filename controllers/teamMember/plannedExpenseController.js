const db = require('../../config/db');

const plannedExpenseController = {
  getPlannedExpenses: async (req, res) => {
    try {
      const userId = req.user.id;

      const [plannedExpenses] = await db.pool.execute(
        `SELECT pe.*, t.name as team_name 
         FROM planned_expenses pe 
         LEFT JOIN teams t ON pe.team_id = t.id 
         WHERE pe.user_id = ? 
         ORDER BY pe.planned_date DESC`,
        [userId]
      );

      res.render('teamMember/plannedExpenses/index', {
        title: 'My Planned Expenses - FinMate',
        plannedExpenses,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        statusOptions: require('../../config/appConfig').PLANNED_EXPENSE_STATUS
      });
    } catch (error) {
      console.error('Get planned expenses error:', error);
      res.render('teamMember/plannedExpenses/index', {
        title: 'My Planned Expenses - FinMate',
        plannedExpenses: [],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        statusOptions: require('../../config/appConfig').PLANNED_EXPENSE_STATUS
      });
    }
  },

  getAddPlannedExpense: (req, res) => {
    res.render('teamMember/plannedExpenses/add', {
      title: 'Add Planned Expense - FinMate',
      user: req.user,
      categories: require('../../config/appConfig').EXPENSE_CATEGORIES
    });
  },

  postAddPlannedExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, description, category, planned_date, status } = req.body;

      // Get user's team ID
      const [users] = await db.pool.execute('SELECT team_id FROM users WHERE id = ?', [userId]);
      const teamId = users[0].team_id;

      await db.pool.execute(
        `INSERT INTO planned_expenses (user_id, team_id, amount, description, category, planned_date, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, teamId, amount, description, category, planned_date, status || 'planned']
      );

      res.redirect('/team-member/planned-expenses');
    } catch (error) {
      console.error('Add planned expense error:', error);
      res.render('teamMember/plannedExpenses/add', {
        title: 'Add Planned Expense - FinMate',
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        error: 'An error occurred while adding planned expense'
      });
    }
  },

  getEditPlannedExpense: async (req, res) => {
    try {
      const plannedExpenseId = req.params.id;
      const userId = req.user.id;

      const [plannedExpenses] = await db.pool.execute(
        'SELECT * FROM planned_expenses WHERE id = ? AND user_id = ?',
        [plannedExpenseId, userId]
      );

      if (plannedExpenses.length === 0) {
        return res.redirect('/team-member/planned-expenses');
      }

      res.render('teamMember/plannedExpenses/edit', {
        title: 'Edit Planned Expense - FinMate',
        plannedExpense: plannedExpenses[0],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        statusOptions: require('../../config/appConfig').PLANNED_EXPENSE_STATUS
      });
    } catch (error) {
      console.error('Get edit planned expense error:', error);
      res.redirect('/team-member/planned-expenses');
    }
  },

  postEditPlannedExpense: async (req, res) => {
    try {
      const plannedExpenseId = req.params.id;
      const userId = req.user.id;
      const { amount, description, category, planned_date, status } = req.body;

      await db.pool.execute(
        `UPDATE planned_expenses SET amount = ?, description = ?, category = ?, planned_date = ?, status = ? 
         WHERE id = ? AND user_id = ?`,
        [amount, description, category, planned_date, status, plannedExpenseId, userId]
      );

      res.redirect('/team-member/planned-expenses');
    } catch (error) {
      console.error('Edit planned expense error:', error);
      res.redirect('/team-member/planned-expenses');
    }
  },

  deletePlannedExpense: async (req, res) => {
    try {
      const plannedExpenseId = req.params.id;
      const userId = req.user.id;

      await db.pool.execute('DELETE FROM planned_expenses WHERE id = ? AND user_id = ?', [plannedExpenseId, userId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Planned expense deleted successfully' });
      }
      
      res.redirect('/team-member/planned-expenses');
    } catch (error) {
      console.error('Delete planned expense error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error deleting planned expense' });
      }
      
      res.redirect('/team-member/planned-expenses');
    }
  }
};

module.exports = plannedExpenseController;