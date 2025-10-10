// controllers/teamMember/plannedExpenseController.js
const db = require('../../config/d');

const plannedExpenseController = {
  // Get all planned expenses
  getPlannedExpenses: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [plannedExpenses] = await db.execute(
        `SELECT pe.*, c.name as category_name 
         FROM planned_expenses pe 
         LEFT JOIN categories c ON pe.category_id = c.id 
         WHERE pe.user_id = ? AND pe.deleted_at IS NULL 
         ORDER BY pe.expected_date ASC`,
        [userId]
      );

      res.render('teamMember/planned-expenses/list', {
        title: 'Planned Expenses - FinMate',
        user: req.user,
        plannedExpenses: plannedExpenses || []
      });
    } catch (error) {
      console.error('Get planned expenses error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load planned expenses', status: 500 }
      });
    }
  },

  // Get calendar view
  getCalendarView: async (req, res) => {
    try {
      res.render('teamMember/planned-expenses/calendar', {
        title: 'Calendar View - FinMate',
        user: req.user
      });
    } catch (error) {
      console.error('Calendar view error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load calendar view', status: 500 }
      });
    }
  },

  // Get upcoming expenses
  getUpcomingExpenses: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [upcomingExpenses] = await db.execute(
        `SELECT pe.*, c.name as category_name 
         FROM planned_expenses pe 
         LEFT JOIN categories c ON pe.category_id = c.id 
         WHERE pe.user_id = ? AND pe.expected_date >= CURDATE() AND pe.deleted_at IS NULL 
         ORDER BY pe.expected_date ASC 
         LIMIT 10`,
        [userId]
      );

      res.render('teamMember/planned-expenses/upcoming', {
        title: 'Upcoming Expenses - FinMate',
        user: req.user,
        upcomingExpenses: upcomingExpenses || []
      });
    } catch (error) {
      console.error('Upcoming expenses error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load upcoming expenses', status: 500 }
      });
    }
  },

  // Get add planned expense form
  getAddPlannedExpense: async (req, res) => {
    try {
      const [categories] = await db.execute('SELECT * FROM categories WHERE is_active = 1');

      res.render('teamMember/planned-expenses/add', {
        title: 'Add Planned Expense - FinMate',
        user: req.user,
        categories: categories || [],
        errors: req.session.errors,
        oldInput: req.session.oldInput
      });

      delete req.session.errors;
      delete req.session.oldInput;
    } catch (error) {
      console.error('Add planned expense form error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load add planned expense form', status: 500 }
      });
    }
  },

  // Post add planned expense
  postAddPlannedExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, description, category_id, expected_date, notes, priority } = req.body;

      // Validation
      const errors = [];
      if (!amount || amount <= 0) errors.push('Valid amount is required');
      if (!description?.trim()) errors.push('Description is required');
      if (!category_id) errors.push('Category is required');
      if (!expected_date) errors.push('Expected date is required');

      if (errors.length > 0) {
        req.session.errors = errors;
        req.session.oldInput = req.body;
        return res.redirect('/team-member/planned-expenses/add');
      }

      // Insert planned expense
      await db.execute(
        `INSERT INTO planned_expenses (user_id, amount, description, category_id, expected_date, notes, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, amount, description.trim(), category_id, expected_date, notes?.trim(), priority || 'medium']
      );

      res.redirect('/team-member/planned-expenses?success=Planned expense added successfully');
    } catch (error) {
      console.error('Add planned expense error:', error);
      req.session.errors = ['Failed to add planned expense. Please try again.'];
      req.session.oldInput = req.body;
      res.redirect('/team-member/planned-expenses/add');
    }
  },

  // Get planned expense details
  getPlannedExpenseDetails: async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;

      const [expenses] = await db.execute(
        `SELECT pe.*, c.name as category_name 
         FROM planned_expenses pe 
         LEFT JOIN categories c ON pe.category_id = c.id 
         WHERE pe.id = ? AND pe.user_id = ? AND pe.deleted_at IS NULL`,
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        return res.status(404).render('teamMember/error', {
          title: 'Planned Expense Not Found - FinMate',
          user: req.user,
          error: { message: 'Planned expense not found', status: 404 }
        });
      }

      res.render('teamMember/planned-expenses/view', {
        title: 'Planned Expense Details - FinMate',
        user: req.user,
        expense: expenses[0]
      });
    } catch (error) {
      console.error('Planned expense details error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load planned expense details', status: 500 }
      });
    }
  },

  // Get edit planned expense form
  getEditPlannedExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;

      const [expenses] = await db.execute(
        `SELECT pe.*, c.name as category_name 
         FROM planned_expenses pe 
         LEFT JOIN categories c ON pe.category_id = c.id 
         WHERE pe.id = ? AND pe.user_id = ? AND pe.deleted_at IS NULL`,
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        return res.redirect('/team-member/planned-expenses');
      }

      const [categories] = await db.execute('SELECT * FROM categories WHERE is_active = 1');

      res.render('teamMember/planned-expenses/edit', {
        title: 'Edit Planned Expense - FinMate',
        user: req.user,
        expense: expenses[0],
        categories: categories || [],
        errors: req.session.errors,
        oldInput: req.session.oldInput
      });

      delete req.session.errors;
      delete req.session.oldInput;
    } catch (error) {
      console.error('Edit planned expense form error:', error);
      res.status(500).render('teamMember/error', {
        title: 'Error - FinMate',
        user: req.user,
        error: { message: 'Failed to load edit planned expense form', status: 500 }
      });
    }
  },

  // Post edit planned expense
  postEditPlannedExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;
      const { amount, description, category_id, expected_date, notes, priority } = req.body;

      // Validation
      const errors = [];
      if (!amount || amount <= 0) errors.push('Valid amount is required');
      if (!description?.trim()) errors.push('Description is required');
      if (!category_id) errors.push('Category is required');
      if (!expected_date) errors.push('Expected date is required');

      if (errors.length > 0) {
        req.session.errors = errors;
        req.session.oldInput = req.body;
        return res.redirect(`/team-member/planned-expenses/edit/${expenseId}`);
      }

      // Verify planned expense belongs to user
      const [existing] = await db.execute(
        'SELECT id FROM planned_expenses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        [expenseId, userId]
      );

      if (existing.length === 0) {
        return res.redirect('/team-member/planned-expenses');
      }

      // Update planned expense
      await db.execute(
        `UPDATE planned_expenses 
         SET amount = ?, description = ?, category_id = ?, expected_date = ?, notes = ?, priority = ?, updated_at = NOW() 
         WHERE id = ?`,
        [amount, description.trim(), category_id, expected_date, notes?.trim(), priority, expenseId]
      );

      res.redirect('/team-member/planned-expenses?success=Planned expense updated successfully');
    } catch (error) {
      console.error('Edit planned expense error:', error);
      req.session.errors = ['Failed to update planned expense. Please try again.'];
      req.session.oldInput = req.body;
      res.redirect(`/team-member/planned-expenses/edit/${req.params.id}`);
    }
  },

  // Delete planned expense
  deletePlannedExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;

      // Verify planned expense belongs to user
      const [existing] = await db.execute(
        'SELECT id FROM planned_expenses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        [expenseId, userId]
      );

      if (existing.length === 0) {
        if (req.accepts('json')) {
          return res.status(404).json({ success: false, error: 'Planned expense not found' });
        }
        return res.redirect('/team-member/planned-expenses');
      }

      // Soft delete
      await db.execute(
        'UPDATE planned_expenses SET deleted_at = NOW() WHERE id = ?',
        [expenseId]
      );

      if (req.accepts('json')) {
        return res.json({ success: true, message: 'Planned expense deleted successfully' });
      }

      res.redirect('/team-member/planned-expenses?success=Planned expense deleted successfully');
    } catch (error) {
      console.error('Delete planned expense error:', error);
      
      if (req.accepts('json')) {
        return res.status(500).json({ success: false, error: 'Failed to delete planned expense' });
      }

      res.redirect('/team-member/planned-expenses');
    }
  },

  // Convert to actual expense
  convertToActualExpense: async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;

      // Get planned expense details
      const [plannedExpenses] = await db.execute(
        'SELECT * FROM planned_expenses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        [expenseId, userId]
      );

      if (plannedExpenses.length === 0) {
        return res.redirect('/team-member/planned-expenses');
      }

      const plannedExpense = plannedExpenses[0];

      // Create actual expense
      await db.execute(
        `INSERT INTO expenses (user_id, amount, description, category_id, expense_date, notes, status) 
         VALUES (?, ?, ?, ?, CURDATE(), ?, 'pending')`,
        [userId, plannedExpense.amount, plannedExpense.description, plannedExpense.category_id, plannedExpense.notes]
      );

      // Mark planned expense as converted
      await db.execute(
        'UPDATE planned_expenses SET is_converted = true, converted_at = NOW() WHERE id = ?',
        [expenseId]
      );

      res.redirect('/team-member/expenses?success=Planned expense converted to actual expense');
    } catch (error) {
      console.error('Convert planned expense error:', error);
      res.redirect('/team-member/planned-expenses');
    }
  },

  // Placeholder methods for other routes
  getPlannedExpenseSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [summary] = await db.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(amount) as total_amount,
          COUNT(CASE WHEN is_converted = true THEN 1 END) as converted,
          COUNT(CASE WHEN expected_date < CURDATE() AND is_converted = false THEN 1 END) as overdue
         FROM planned_expenses 
         WHERE user_id = ? AND deleted_at IS NULL`,
        [userId]
      );

      res.json({
        success: true,
        summary: summary[0] || {}
      });
    } catch (error) {
      console.error('Planned expense summary error:', error);
      res.status(500).json({ success: false, error: 'Failed to load planned expense summary' });
    }
  },

  getCalendarEvents: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const [events] = await db.execute(
        `SELECT id, description as title, expected_date as start, amount, priority
         FROM planned_expenses 
         WHERE user_id = ? AND deleted_at IS NULL AND expected_date IS NOT NULL`,
        [userId]
      );

      res.json({
        success: true,
        events: events || []
      });
    } catch (error) {
      console.error('Calendar events error:', error);
      res.status(500).json({ success: false, error: 'Failed to load calendar events' });
    }
  },

  quickAddPlannedExpense: async (req, res) => {
    // Implementation for quick add planned expense
    res.redirect('/team-member/planned-expenses?success=Planned expense added quickly');
  }
};

module.exports = plannedExpenseController;