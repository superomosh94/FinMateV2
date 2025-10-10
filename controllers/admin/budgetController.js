const db = require('../../config/db');

const budgetController = {
  getBudgets: async (req, res) => {
    try {
      const [budgets] = await db.pool.execute(
        `SELECT b.*, u.username, u.first_name, u.last_name, t.name as team_name 
         FROM budgets b 
         JOIN users u ON b.user_id = u.id 
         LEFT JOIN teams t ON b.team_id = t.id 
         ORDER BY b.created_at DESC`
      );

      res.render('admin/budgets/index', {
        title: 'Manage Budgets - FinMate',
        budgets,
        user: req.user
      });
    } catch (error) {
      console.error('Get budgets error:', error);
      res.render('admin/budgets/index', {
        title: 'Manage Budgets - FinMate',
        budgets: [],
        user: req.user
      });
    }
  },

  getAddBudget: async (req, res) => {
    try {
      const [users] = await db.pool.execute('SELECT id, username, first_name, last_name FROM users WHERE is_active = TRUE');
      const [teams] = await db.pool.execute('SELECT * FROM teams');

      res.render('admin/budgets/add', {
        title: 'Add Budget - FinMate',
        users,
        teams,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        periods: require('../../config/appConfig').BUDGET_PERIODS
      });
    } catch (error) {
      console.error('Get add budget error:', error);
      res.redirect('/admin/budgets');
    }
  },

  postAddBudget: async (req, res) => {
    try {
      const { user_id, team_id, category, amount, period, start_date, end_date } = req.body;

      await db.pool.execute(
        `INSERT INTO budgets (user_id, team_id, category, amount, period, start_date, end_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, team_id || null, category, amount, period, start_date, end_date || null]
      );

      res.redirect('/admin/budgets');
    } catch (error) {
      console.error('Add budget error:', error);
      const [users] = await db.pool.execute('SELECT id, username, first_name, last_name FROM users WHERE is_active = TRUE');
      const [teams] = await db.pool.execute('SELECT * FROM teams');
      
      res.render('admin/budgets/add', {
        title: 'Add Budget - FinMate',
        users,
        teams,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        periods: require('../../config/appConfig').BUDGET_PERIODS,
        error: 'An error occurred while adding budget'
      });
    }
  },

  getEditBudget: async (req, res) => {
    try {
      const budgetId = req.params.id;
      const [budgets] = await db.pool.execute(
        `SELECT b.*, u.username, u.first_name, u.last_name, t.name as team_name 
         FROM budgets b 
         JOIN users u ON b.user_id = u.id 
         LEFT JOIN teams t ON b.team_id = t.id 
         WHERE b.id = ?`,
        [budgetId]
      );

      if (budgets.length === 0) {
        return res.redirect('/admin/budgets');
      }

      const [users] = await db.pool.execute('SELECT id, username, first_name, last_name FROM users WHERE is_active = TRUE');
      const [teams] = await db.pool.execute('SELECT * FROM teams');

      res.render('admin/budgets/edit', {
        title: 'Edit Budget - FinMate',
        budget: budgets[0],
        users,
        teams,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        periods: require('../../config/appConfig').BUDGET_PERIODS
      });
    } catch (error) {
      console.error('Get edit budget error:', error);
      res.redirect('/admin/budgets');
    }
  },

  postEditBudget: async (req, res) => {
    try {
      const budgetId = req.params.id;
      const { user_id, team_id, category, amount, period, start_date, end_date } = req.body;

      await db.pool.execute(
        `UPDATE budgets SET user_id = ?, team_id = ?, category = ?, amount = ?, period = ?, start_date = ?, end_date = ? 
         WHERE id = ?`,
        [user_id, team_id || null, category, amount, period, start_date, end_date || null, budgetId]
      );

      res.redirect('/admin/budgets');
    } catch (error) {
      console.error('Edit budget error:', error);
      res.redirect('/admin/budgets');
    }
  },

  deleteBudget: async (req, res) => {
    try {
      const budgetId = req.params.id;
      await db.pool.execute('DELETE FROM budgets WHERE id = ?', [budgetId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Budget deleted successfully' });
      }
      
      res.redirect('/admin/budgets');
    } catch (error) {
      console.error('Delete budget error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error deleting budget' });
      }
      
      res.redirect('/admin/budgets');
    }
  }
};

module.exports = budgetController;