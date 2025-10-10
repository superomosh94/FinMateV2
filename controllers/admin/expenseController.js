const db = require('../../config/db');

const expenseController = {
  getExpenses: async (req, res) => {
    try {
      const [expenses] = await db.pool.execute(
        `SELECT e.*, u.username, u.first_name, u.last_name, t.name as team_name 
         FROM expenses e 
         JOIN users u ON e.user_id = u.id 
         LEFT JOIN teams t ON e.team_id = t.id 
         ORDER BY e.created_at DESC`
      );

      res.render('admin/expenses/index', {
        title: 'Manage Expenses - FinMate',
        expenses,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    } catch (error) {
      console.error('Get expenses error:', error);
      res.render('admin/expenses/index', {
        title: 'Manage Expenses - FinMate',
        expenses: [],
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    }
  },

  getAddExpense: async (req, res) => {
    try {
      const [users] = await db.pool.execute('SELECT id, username, first_name, last_name FROM users WHERE is_active = TRUE');
      const [teams] = await db.pool.execute('SELECT * FROM teams');

      res.render('admin/expenses/add', {
        title: 'Add Expense - FinMate',
        users,
        teams,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    } catch (error) {
      console.error('Get add expense error:', error);
      res.redirect('/admin/expenses');
    }
  },

  postAddExpense: async (req, res) => {
    try {
      const { user_id, team_id, amount, description, category, date, status } = req.body;

      await db.pool.execute(
        `INSERT INTO expenses (user_id, team_id, amount, description, category, date, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, team_id || null, amount, description, category, date, status || 'pending']
      );

      res.redirect('/admin/expenses');
    } catch (error) {
      console.error('Add expense error:', error);
      const [users] = await db.pool.execute('SELECT id, username, first_name, last_name FROM users WHERE is_active = TRUE');
      const [teams] = await db.pool.execute('SELECT * FROM teams');
      
      res.render('admin/expenses/add', {
        title: 'Add Expense - FinMate',
        users,
        teams,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES,
        error: 'An error occurred while adding expense'
      });
    }
  },

  getEditExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      const [expenses] = await db.pool.execute(
        `SELECT e.*, u.username, u.first_name, u.last_name, t.name as team_name 
         FROM expenses e 
         JOIN users u ON e.user_id = u.id 
         LEFT JOIN teams t ON e.team_id = t.id 
         WHERE e.id = ?`,
        [expenseId]
      );

      if (expenses.length === 0) {
        return res.redirect('/admin/expenses');
      }

      const [users] = await db.pool.execute('SELECT id, username, first_name, last_name FROM users WHERE is_active = TRUE');
      const [teams] = await db.pool.execute('SELECT * FROM teams');

      res.render('admin/expenses/edit', {
        title: 'Edit Expense - FinMate',
        expense: expenses[0],
        users,
        teams,
        user: req.user,
        categories: require('../../config/appConfig').EXPENSE_CATEGORIES
      });
    } catch (error) {
      console.error('Get edit expense error:', error);
      res.redirect('/admin/expenses');
    }
  },

  postEditExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      const { user_id, team_id, amount, description, category, date, status } = req.body;

      await db.pool.execute(
        `UPDATE expenses SET user_id = ?, team_id = ?, amount = ?, description = ?, category = ?, date = ?, status = ? 
         WHERE id = ?`,
        [user_id, team_id || null, amount, description, category, date, status, expenseId]
      );

      res.redirect('/admin/expenses');
    } catch (error) {
      console.error('Edit expense error:', error);
      res.redirect('/admin/expenses');
    }
  },

  deleteExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      await db.pool.execute('DELETE FROM expenses WHERE id = ?', [expenseId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Expense deleted successfully' });
      }
      
      res.redirect('/admin/expenses');
    } catch (error) {
      console.error('Delete expense error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error deleting expense' });
      }
      
      res.redirect('/admin/expenses');
    }
  },

  approveExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      await db.pool.execute('UPDATE expenses SET status = "approved" WHERE id = ?', [expenseId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Expense approved successfully' });
      }
      
      res.redirect('/admin/expenses');
    } catch (error) {
      console.error('Approve expense error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error approving expense' });
      }
      
      res.redirect('/admin/expenses');
    }
  },

  rejectExpense: async (req, res) => {
    try {
      const expenseId = req.params.id;
      await db.pool.execute('UPDATE expenses SET status = "rejected" WHERE id = ?', [expenseId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Expense rejected successfully' });
      }
      
      res.redirect('/admin/expenses');
    } catch (error) {
      console.error('Reject expense error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error rejecting expense' });
      }
      
      res.redirect('/admin/expenses');
    }
  }
};

module.exports = expenseController;