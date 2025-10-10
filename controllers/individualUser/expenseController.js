const db = require('../../config/db');

const expenseController = {
  getExpenses: async (req, res) => {
    try {
      const userId = req.user.id;

      const [expenses] = await db.pool.execute(
        `SELECT e.* 
         FROM expenses e 
         WHERE e.user_id = ? 
         ORDER BY e.created_at DESC`,
        [userId]
      );

      res.render('individualUser/expenses/index', {
        title: 'My Expenses - FinMate',
        expenses,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    } catch (error) {
      console.error('Get expenses error:', error);
      res.render('individualUser/expenses/index', {
        title: 'My Expenses - FinMate',
        expenses: [],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    }
  },

  getAddExpense: (req, res) => {
    res.render('individualUser/expenses/add', {
      title: 'Add Expense - FinMate',
      user: req.user,
      categories: require('../../config/appConfig').EXPENSE_CATEGORIES
    });
  },

  postAddExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, description, category, date } = req.body;

      await db.pool.execute(
        `INSERT INTO expenses (user_id, amount, description, category, date, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, amount, description, category, date, 'approved'] // Auto-approve for individual users
      );

      res.redirect('/user/expenses');
    } catch (error) {
      console.error('Add expense error:', error);
      res.render('individualUser/expenses/add', {
        title: 'Add Expense - FinMate',
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        error: 'An error occurred while adding expense'
      });
    }
  },

  getEditExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      const userId = req.user.id;

      const [expenses] = await db.pool.execute(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        return res.redirect('/user/expenses');
      }

      res.render('individualUser/expenses/edit', {
        title: 'Edit Expense - FinMate',
        expense: expenses[0],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    } catch (error) {
      console.error('Get edit expense error:', error);
      res.redirect('/user/expenses');
    }
  },

  postEditExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      const userId = req.user.id;
      const { amount, description, category, date } = req.body;

      await db.pool.execute(
        `UPDATE expenses SET amount = ?, description = ?, category = ?, date = ? 
         WHERE id = ? AND user_id = ?`,
        [amount, description, category, date, expenseId, userId]
      );

      res.redirect('/user/expenses');
    } catch (error) {
      console.error('Edit expense error:', error);
      res.redirect('/user/expenses');
    }
  },

  deleteExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      const userId = req.user.id;

      await db.pool.execute('DELETE FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Expense deleted successfully' });
      }
      
      res.redirect('/user/expenses');
    } catch (error) {
      console.error('Delete expense error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error deleting expense' });
      }
      
      res.redirect('/user/expenses');
    }
  }
};

module.exports = expenseController;