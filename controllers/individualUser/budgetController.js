const db = require('../../config/db');

const budgetController = {
  getBudgets: async (req, res) => {
    try {
      const userId = req.user.id;

      const [budgets] = await db.pool.execute(
        `SELECT b.* 
         FROM budgets b 
         WHERE b.user_id = ? 
         ORDER BY b.created_at DESC`,
        [userId]
      );

      res.render('individualUser/budgets/index', {
        title: 'My Budgets - FinMate',
        budgets,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        periods: require('../../config/appConfig').BUDGET_PERIODS
      });
    } catch (error) {
      console.error('Get budgets error:', error);
      res.render('individualUser/budgets/index', {
        title: 'My Budgets - FinMate',
        budgets: [],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        periods: require('../../config/appConfig').BUDGET_PERIODS
      });
    }
  },

  getAddBudget: (req, res) => {
    res.render('individualUser/budgets/add', {
      title: 'Add Budget - FinMate',
      user: req.user,
      categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
      periods: require('../../config/appConfig').BUDGET_PERIODS
    });
  },

  postAddBudget: async (req, res) => {
    try {
      const userId = req.user.id;
      const { category, amount, period, start_date, end_date } = req.body;

      await db.pool.execute(
        `INSERT INTO budgets (user_id, category, amount, period, start_date, end_date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, category, amount, period, start_date, end_date || null]
      );

      res.redirect('/user/budgets');
    } catch (error) {
      console.error('Add budget error:', error);
      res.render('individualUser/budgets/add', {
        title: 'Add Budget - FinMate',
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
      const userId = req.user.id;

      const [budgets] = await db.pool.execute(
        'SELECT * FROM budgets WHERE id = ? AND user_id = ?',
        [budgetId, userId]
      );

      if (budgets.length === 0) {
        return res.redirect('/user/budgets');
      }

      res.render('individualUser/budgets/edit', {
        title: 'Edit Budget - FinMate',
        budget: budgets[0],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        periods: require('../../config/appConfig').BUDGET_PERIODS
      });
    } catch (error) {
      console.error('Get edit budget error:', error);
      res.redirect('/user/budgets');
    }
  },

  postEditBudget: async (req, res) => {
    try {
      const budgetId = req.params.id;
      const userId = req.user.id;
      const { category, amount, period, start_date, end_date } = req.body;

      await db.pool.execute(
        `UPDATE budgets SET category = ?, amount = ?, period = ?, start_date = ?, end_date = ? 
         WHERE id = ? AND user_id = ?`,
        [category, amount, period, start_date, end_date || null, budgetId, userId]
      );

      res.redirect('/user/budgets');
    } catch (error) {
      console.error('Edit budget error:', error);
      res.redirect('/user/budgets');
    }
  },

  deleteBudget: async (req, res) => {
    try {
      const budgetId = req.params.id;
      const userId = req.user.id;

      await db.pool.execute('DELETE FROM budgets WHERE id = ? AND user_id = ?', [budgetId, userId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Budget deleted successfully' });
      }
      
      res.redirect('/user/budgets');
    } catch (error) {
      console.error('Delete budget error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error deleting budget' });
      }
      
      res.redirect('/user/budgets');
    }
  }
};

module.exports = budgetController;