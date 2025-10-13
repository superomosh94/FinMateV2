const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { safeQuery } = require('../utils/dbHelper');
const { validateExpense } = require('../middlewares/validateMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

// Helper functions for MySQL2 result handling
const handleMySQL2Result = (result) => {
  return Array.isArray(result) ? result : [];
};

const getFirstRow = (result) => {
  const rows = handleMySQL2Result(result);
  return rows.length > 0 ? rows[0] : null;
};

// Updated getDashboardData function
const getDashboardData = async (userId, role = 'individual_user') => {
  try {
    const db = require('../config/db');

    // All queries without array destructuring
    const expenseRows = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses WHERE user_id = ?`,
      [userId]
    );

    const savingsRows = await db.execute(
      `SELECT COALESCE(SUM(current_amount), 0) AS totalSavings FROM savings_goals WHERE user_id = ?`,
      [userId]
    );

    const recentTransactionsResult = await db.execute(
      `SELECT id, description, amount, category, date, created_at 
       FROM expenses 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    const activeBudgetsResult = await db.execute(
      `SELECT b.id, b.category, b.amount, 
              COALESCE((SELECT SUM(e.amount) FROM expenses e 
                       WHERE e.user_id = b.user_id AND e.category = b.category 
                       AND MONTH(e.date) = MONTH(CURRENT_DATE()) 
                       AND YEAR(e.date) = YEAR(CURRENT_DATE())), 0) AS spent
       FROM budgets b 
       WHERE b.user_id = ?`,
      [userId]
    );

    const plannedRows = await db.execute(
      `SELECT COUNT(*) AS plannedExpenses 
       FROM planned_expenses 
       WHERE user_id = ? AND planned_date >= CURDATE()`,
      [userId]
    );

    const savingsGoalsResult = await db.execute(
      `SELECT id, name, target_amount, current_amount, target_date, status 
       FROM savings_goals 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    // Process results using helper functions
    const expenseData = getFirstRow(expenseRows);
    const savingsData = getFirstRow(savingsRows);
    const plannedData = getFirstRow(plannedRows);
    const notificationData = getFirstRow(notificationRows);

    const totalExpenses = parseFloat(expenseData?.totalExpenses) || 0;
    const totalSavings = parseFloat(savingsData?.totalSavings) || 0;
    const plannedExpenses = parseInt(plannedData?.plannedExpenses, 10) || 0;
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    // Process arrays
    const safeRecentTransactions = handleMySQL2Result(recentTransactionsResult);
    const safeActiveBudgetsData = handleMySQL2Result(activeBudgetsResult);
    const safeSavingsGoals = handleMySQL2Result(savingsGoalsResult);

    // Convert amounts to numbers
    safeRecentTransactions.forEach(transaction => {
      transaction.amount = parseFloat(transaction.amount) || 0;
    });

    safeSavingsGoals.forEach(goal => {
      goal.target_amount = parseFloat(goal.target_amount) || 0;
      goal.current_amount = parseFloat(goal.current_amount) || 0;
    });

    safeActiveBudgetsData.forEach(budget => {
      budget.amount = parseFloat(budget.amount) || 0;
      budget.spent = parseFloat(budget.spent) || 0;
    });

    const result = {
      totalExpenses: totalExpenses,
      totalSavings: totalSavings,
      recentTransactions: safeRecentTransactions,
      activeBudgets: safeActiveBudgetsData.length,
      activeBudgetsData: safeActiveBudgetsData,
      plannedExpenses: plannedExpenses,
      savingsGoals: safeSavingsGoals,
      savingsGoalsCount: safeSavingsGoals.length,
      notificationCount: notificationCount
    };

    console.log('✅ getDashboardData completed:', {
      totalExpenses: result.totalExpenses,
      totalSavings: result.totalSavings,
      recentTransactionsCount: result.recentTransactions.length,
      activeBudgets: result.activeBudgets,
      savingsGoalsCount: result.savingsGoals.length,
      notificationCount: result.notificationCount
    });

    return result;
    
  } catch (error) {
    console.error('❌ getDashboardData error:', error);
    throw error;
  }
};

// ======== APPLY AUTHENTICATION MIDDLEWARE ========
router.use(authenticate, requireRole('individual_user'));

// ======== ROUTE DEFINITIONS ========

// ROOT ROUTE - Redirect to dashboard
router.get('/', (req, res) => {
  res.redirect('/user/dashboard');
});

// DASHBOARD ROUTE
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role || 'individual_user';

  try {
    console.log('📊 Fetching dashboard data for user:', userId);
    const data = await getDashboardData(userId, role);

    console.log('✅ Dashboard data fetched successfully');

    res.render('individualUser/dashboard', {
      title: 'Personal Dashboard',
      user: req.user,
      currentPage: 'dashboard',
      data,
      notificationCount: data.notificationCount || 0,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });
  } catch (error) {
    console.error('❌ Dashboard route error:', error);
    
    const fallbackData = {
      totalSavings: 0,
      totalExpenses: 0,
      expensesCount: 0,
      activeBudgets: 0,
      plannedExpenses: 0,
      recentTransactions: [],
      recentTransactionsCount: 0,
      savingsGoals: [],
      activeBudgetsData: [],
      notificationCount: 0
    };

    res.render('individualUser/dashboard', {
      title: 'Personal Dashboard',
      user: req.user,
      currentPage: 'dashboard',
      data: fallbackData,
      notificationCount: 0,
      error: 'Unable to load dashboard data. Some features may be unavailable.'
    });
  }
}));

// ======== SAVINGS ROUTES ========

// GET Savings page
// ======== SAVINGS ROUTES ========

// GET Savings page (FIXED - without description column)
router.get('/savings', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  try {
    console.log('💰 Fetching savings goals for user:', userId);
    
    // FIXED: Removed description column
    const savingsGoals = await db.execute(`
      SELECT id, name, target_amount, current_amount, target_date, status, created_at, updated_at
      FROM savings_goals 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    const savingsArray = handleMySQL2Result(savingsGoals);

    console.log('✅ Savings goals loaded:', { count: savingsArray.length });

    // Get notification count
    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/savings/list', {
      title: 'My Savings Goals',
      user: req.user,
      currentPage: 'savings',
      savings: savingsArray,
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Savings route error:', error);
    
    res.render('individualUser/savings/list', {
      title: 'My Savings Goals',
      user: req.user,
      currentPage: 'savings',
      savings: [],
      notificationCount: 0,
      error: 'Unable to load savings goals'
    });
  }
}));

// GET Add Savings page
router.get('/savings/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  try {
    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/savings/add', {
      title: 'Add Savings Goal',
      user: req.user,
      currentPage: 'savings',
      formData: {},
      notificationCount: notificationCount,
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Add savings page error:', error);
    res.redirect('/user/savings?error=Failed to load add savings page');
  }
}));

// POST Add Savings goal (FIXED - without description)
router.post('/savings/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, target_amount, target_date, initial_amount } = req.body;

  console.log('📝 Add savings request:', {
    userId,
    name,
    target_amount,
    target_date,
    initial_amount
  });

  try {
    const db = require('../config/db');
    
    // FIXED: Removed description column
    const result = await db.execute(`
      INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [
      userId, 
      name, 
      parseFloat(target_amount), 
      parseFloat(initial_amount) || 0, 
      target_date || null
    ]);

    if (result.affectedRows > 0) {
      console.log('🎉 Savings goal created successfully');
      return res.redirect('/user/savings?success=true&message=Savings goal created successfully');
    } else {
      throw new Error('No rows were affected - savings goal not created');
    }
    
  } catch (error) {
    console.error('❌ Add savings error:', error);
    
    let errorMessage = 'Failed to create savings goal';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'A savings goal with this name already exists';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }

    const db = require('../config/db');
    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/savings/add', {
      title: 'Add Savings Goal',
      user: req.user,
      currentPage: 'savings',
      formData: req.body,
      notificationCount: notificationCount,
      error: errorMessage
    });
  }
}));

// POST Add amount to savings
router.post('/savings/add-amount/:id', asyncHandler(async (req, res) => {
  const savingsId = req.params.id;
  const userId = req.user.id;
  const { amount } = req.body;

  console.log('💰 Add amount to savings:', { savingsId, userId, amount });

  try {
    const db = require('../config/db');
    
    const currentSavings = await db.execute(
      `SELECT current_amount, target_amount FROM savings_goals WHERE id = ? AND user_id = ?`,
      [savingsId, userId]
    );

    const savingsData = getFirstRow(currentSavings);
    if (!savingsData) {
      return res.redirect('/user/savings?error=Savings goal not found');
    }

    const currentAmount = parseFloat(savingsData.current_amount);
    const targetAmount = parseFloat(savingsData.target_amount);
    const addAmount = parseFloat(amount);

    if (addAmount <= 0) {
      return res.redirect('/user/savings?error=Amount must be greater than 0');
    }

    if (currentAmount + addAmount > targetAmount) {
      return res.redirect('/user/savings?error=Amount exceeds remaining target');
    }

    const result = await db.execute(`
      UPDATE savings_goals 
      SET current_amount = current_amount + ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [addAmount, savingsId, userId]);

    if (result.affectedRows > 0) {
      console.log('🎉 Amount added successfully');
      return res.redirect('/user/savings?success=true&message=Amount added successfully');
    } else {
      throw new Error('Failed to update savings goal');
    }
    
  } catch (error) {
    console.error('❌ Add amount error:', error);
    res.redirect('/user/savings?error=Failed to add amount to savings goal');
  }
}));

// GET Edit Savings page
router.get('/savings/edit/:id', asyncHandler(async (req, res) => {
  const savingsId = req.params.id;
  const userId = req.user.id;

  console.log('🔍 Fetching savings goal for edit:', { savingsId, userId });

  try {
    const db = require('../config/db');
    
    const savingsGoals = await db.execute(`
      SELECT * FROM savings_goals WHERE id = ? AND user_id = ?
    `, [savingsId, userId]);

    const savingsData = handleMySQL2Result(savingsGoals);

    if (savingsData.length === 0) {
      console.log('❌ Savings goal not found');
      return res.redirect('/user/savings?error=Savings goal not found');
    }

    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/savings/edit', {
      title: 'Edit Savings Goal',
      user: req.user,
      currentPage: 'savings',
      savings: savingsData[0],
      notificationCount: notificationCount,
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Edit savings error:', error);
    res.redirect('/user/savings?error=Failed to load savings goal');
  }
}));

// POST Update Savings goal (FIXED - without description)
router.post('/savings/edit/:id', asyncHandler(async (req, res) => {
  const savingsId = req.params.id;
  const userId = req.user.id;
  const { name, target_amount, target_date } = req.body;

  console.log('📝 Edit savings request:', {
    savingsId,
    userId,
    name,
    target_amount,
    target_date
  });

  try {
    const db = require('../config/db');
    
    // FIXED: Removed description column
    const result = await db.execute(`
      UPDATE savings_goals 
      SET name = ?, target_amount = ?, target_date = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [name, parseFloat(target_amount), target_date || null, savingsId, userId]);

    if (result.affectedRows > 0) {
      console.log('🎉 Savings goal updated successfully');
      return res.redirect('/user/savings?success=true&message=Savings goal updated successfully');
    } else {
      throw new Error('Savings goal not found or no changes made');
    }
    
  } catch (error) {
    console.error('❌ Update savings error:', error);
    res.redirect(`/user/savings/edit/${savingsId}?error=Failed to update savings goal: ${error.message}`);
  }
}));

// POST Delete Savings goal
router.post('/savings/delete/:id', asyncHandler(async (req, res) => {
  const savingsId = req.params.id;
  const userId = req.user.id;

  console.log('🗑️ Delete savings goal:', { savingsId, userId });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(`
      DELETE FROM savings_goals WHERE id = ? AND user_id = ?
    `, [savingsId, userId]);

    if (result.affectedRows > 0) {
      console.log('🎉 Savings goal deleted successfully');
      return res.redirect('/user/savings?success=true&message=Savings goal deleted successfully');
    }

    throw new Error('Savings goal not deleted');
    
  } catch (error) {
    console.error('❌ Delete savings error:', error);
    res.redirect('/user/savings?error=Failed to delete savings goal');
  }
}));

// ======== EXPENSES ROUTES ========

router.get('/expenses', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  const expenses = await safeQuery(`
    SELECT * FROM expenses 
    WHERE user_id = ? 
    ORDER BY date DESC, created_at DESC
  `, [userId]);

  const expensesArray = Array.isArray(expenses) ? expenses : [];

  const notificationRows = await db.execute(
    `SELECT COUNT(*) AS notificationCount 
     FROM notifications 
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  const notificationData = getFirstRow(notificationRows);
  const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const thisMonthExpenses = expensesArray.filter(expense => {
    if (!expense?.date) return false;
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth &&
           expenseDate.getFullYear() === currentYear;
  });

  const totalAmount = expensesArray.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const thisMonthAmount = thisMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const categories = expensesArray.map(exp => exp.category).filter(Boolean);
  const categoryCount = new Set(categories).size;

  const summary = {
    totalAmount,
    thisMonthAmount,
    categoryCount,
    totalExpenses: expensesArray.length
  };

  res.render('individualUser/expenses/list', {
    title: 'My Expenses',
    user: req.user,
    currentPage: 'expenses',
    expenses: expensesArray,
    summary,
    notificationCount: notificationCount,
    success: req.query.success,
    message: req.query.message,
    error: req.query.error || ''
  });
}));

router.get('/expenses/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  const notificationRows = await db.execute(
    `SELECT COUNT(*) AS notificationCount 
     FROM notifications 
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  const notificationData = getFirstRow(notificationRows);
  const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

  res.render('individualUser/expenses/add', {
    title: 'Add Expense',
    user: req.user,
    currentPage: 'expenses',
    formData: {},
    notificationCount: notificationCount,
    error: req.query.error || ''
  });
}));

router.post('/expenses/add', validateExpense, asyncHandler(async (req, res) => {
  const { amount, description, category, date } = req.body;
  const userId = req.user.id;
  const expenseDate = date || new Date().toISOString().split('T')[0];

  const result = await safeQuery(`
    INSERT INTO expenses (user_id, amount, description, category, date, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', NOW())
  `, [userId, parseFloat(amount), description, category, expenseDate]);

  if (result?.affectedRows > 0) {
    return res.redirect('/user/expenses?success=true&message=Expense added successfully');
  }

  throw new Error('Expense not inserted - no rows affected');
}));

// GET Edit Expense page
router.get('/expenses/edit/:id', asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;
  const db = require('../config/db');

  console.log('🔍 Fetching expense for edit:', { expenseId, userId });

  try {
    const expenses = await db.execute(`
      SELECT * FROM expenses WHERE id = ? AND user_id = ?
    `, [expenseId, userId]);

    const expenseData = handleMySQL2Result(expenses);

    if (expenseData.length === 0) {
      console.log('❌ Expense not found');
      return res.redirect('/user/expenses?error=Expense not found');
    }

    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/expenses/edit', {
      title: 'Edit Expense',
      user: req.user,
      currentPage: 'expenses',
      expense: expenseData[0],
      notificationCount: notificationCount,
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Edit expense error:', error);
    res.redirect('/user/expenses?error=Failed to load expense');
  }
}));

// POST Update Expense
router.post('/expenses/edit/:id', validateExpense, asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;
  const { amount, description, category, date } = req.body;

  console.log('📝 Edit expense request:', {
    expenseId,
    userId,
    amount,
    description,
    category,
    date
  });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(`
      UPDATE expenses 
      SET amount = ?, description = ?, category = ?, date = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [parseFloat(amount), description, category, date, expenseId, userId]);

    if (result.affectedRows > 0) {
      console.log('🎉 Expense updated successfully');
      return res.redirect('/user/expenses?success=true&message=Expense updated successfully');
    } else {
      throw new Error('Expense not found or no changes made');
    }
    
  } catch (error) {
    console.error('❌ Update expense error:', error);
    res.redirect(`/user/expenses/edit/${expenseId}?error=Failed to update expense: ${error.message}`);
  }
}));

// POST Delete Expense
router.post('/expenses/delete/:id', asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;

  try {
    const db = require('../config/db');
    
    const result = await db.execute(`
      DELETE FROM expenses WHERE id = ? AND user_id = ?
    `, [expenseId, userId]);

    if (result.affectedRows > 0) {
      return res.redirect('/user/expenses?success=true&message=Expense deleted successfully');
    }

    throw new Error('Expense not deleted');
    
  } catch (error) {
    console.error('❌ Delete expense error:', error);
    res.redirect('/user/expenses?error=Failed to delete expense');
  }
}));

// ======== BUDGETS ROUTES ========

router.get('/budgets', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  try {
    const budgets = await db.execute(`
      SELECT 
        b.id,
        b.category as name,
        b.category,
        b.amount,
        b.period,
        b.start_date,
        b.end_date,
        b.created_at,
        b.updated_at,
        COALESCE((
          SELECT SUM(e.amount) 
          FROM expenses e 
          WHERE e.user_id = b.user_id 
            AND e.category = b.category 
            AND e.date BETWEEN COALESCE(b.start_date, DATE_FORMAT(NOW(), '%Y-%m-01')) 
            AND COALESCE(b.end_date, LAST_DAY(NOW()))
            AND e.status = 'approved'
        ), 0) as spent_amount
      FROM budgets b 
      WHERE b.user_id = ? 
      ORDER BY b.created_at DESC
    `, [userId]);

    const budgetsArray = handleMySQL2Result(budgets);

    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/budgets/list', {
      title: 'My Budgets',
      user: req.user,
      currentPage: 'budgets',
      budgets: budgetsArray,
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Budgets route error:', error);
    
    const budgets = await safeQuery(`
      SELECT 
        id,
        category as name,
        category,
        amount,
        period,
        start_date,
        end_date,
        created_at,
        updated_at
      FROM budgets 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    const budgetsArray = Array.isArray(budgets) ? budgets : [];
    const budgetsWithSpent = budgetsArray.map(budget => ({
      ...budget,
      spent_amount: 0
    }));

    res.render('individualUser/budgets/list', {
      title: 'My Budgets',
      user: req.user,
      currentPage: 'budgets',
      budgets: budgetsWithSpent,
      notificationCount: 0,
      error: 'Unable to load budget calculations'
    });
  }
}));

// GET Add Budget page
router.get('/budgets/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  const notificationRows = await db.execute(
    `SELECT COUNT(*) AS notificationCount 
     FROM notifications 
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  const notificationData = getFirstRow(notificationRows);
  const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

  res.render('individualUser/budgets/add', {
    title: 'Add Budget',
    user: req.user,
    currentPage: 'budgets',
    formData: {},
    notificationCount: notificationCount,
    error: req.query.error || ''
  });
}));

// POST Add Budget
router.post('/budgets/add', asyncHandler(async (req, res) => {
  const { category, amount, period, start_date, end_date } = req.body;
  const userId = req.user.id;

  console.log('📝 Add budget request:', {
    userId,
    category,
    amount,
    period,
    start_date,
    end_date
  });

  try {
    const db = require('../config/db');
    
    const formatDateForMySQL = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateStr;
    };

    const mysqlStartDate = formatDateForMySQL(start_date);
    const mysqlEndDate = formatDateForMySQL(end_date);

    const result = await db.execute(`
      INSERT INTO budgets (user_id, category, amount, period, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, category, parseFloat(amount), period, mysqlStartDate, mysqlEndDate]);

    if (result.affectedRows > 0) {
      console.log('🎉 Budget created successfully');
      return res.redirect('/user/budgets?success=true&message=Budget added successfully');
    } else {
      throw new Error('No rows were affected - budget not created');
    }
    
  } catch (error) {
    console.error('❌ Add budget error:', error);
    
    let errorMessage = 'Failed to add budget';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'A budget with this category already exists';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }

    res.render('individualUser/budgets/add', {
      title: 'Add Budget',
      user: req.user,
      currentPage: 'budgets',
      formData: req.body,
      notificationCount: 0,
      error: errorMessage
    });
  }
}));

// GET Edit Budget page
router.get('/budgets/edit/:id', asyncHandler(async (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;
  const db = require('../config/db');

  try {
    const budgets = await db.execute(`
      SELECT * FROM budgets WHERE id = ? AND user_id = ?
    `, [budgetId, userId]);

    const budgetData = handleMySQL2Result(budgets);

    if (budgetData.length === 0) {
      return res.redirect('/user/budgets?error=Budget not found');
    }

    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/budgets/edit', {
      title: 'Edit Budget',
      user: req.user,
      currentPage: 'budgets',
      budget: budgetData[0],
      notificationCount: notificationCount,
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Edit budget error:', error);
    res.redirect('/user/budgets?error=Failed to load budget');
  }
}));

// POST Update Budget
router.post('/budgets/edit/:id', asyncHandler(async (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;
  const { category, amount, period, start_date, end_date } = req.body;

  console.log('📝 Edit budget request:', {
    budgetId,
    category,
    amount,
    period,
    start_date,
    end_date
  });

  try {
    const db = require('../config/db');
    
    const formatDateForMySQL = (dateStr) => {
      if (!dateStr) return null;
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return dateStr;
    };

    const mysqlStartDate = formatDateForMySQL(start_date);
    const mysqlEndDate = formatDateForMySQL(end_date);
    
    const result = await db.execute(`
      UPDATE budgets 
      SET category = ?, amount = ?, period = ?, start_date = ?, end_date = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [category, parseFloat(amount), period, mysqlStartDate, mysqlEndDate, budgetId, userId]);

    if (result.affectedRows > 0) {
      console.log('🎉 Budget updated successfully');
      return res.redirect('/user/budgets?success=true&message=Budget updated successfully');
    } else {
      throw new Error('Budget not found or no changes made');
    }
    
  } catch (error) {
    console.error('❌ Update budget error:', error);
    res.redirect(`/user/budgets/edit/${budgetId}?error=Failed to update budget: ${error.message}`);
  }
}));

// POST Delete Budget
router.post('/budgets/delete/:id', asyncHandler(async (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;

  try {
    const db = require('../config/db');
    
    const result = await db.execute(`
      DELETE FROM budgets WHERE id = ? AND user_id = ?
    `, [budgetId, userId]);

    if (result.affectedRows > 0) {
      return res.redirect('/user/budgets?success=true&message=Budget deleted successfully');
    }

    throw new Error('Budget not deleted');
    
  } catch (error) {
    console.error('❌ Delete budget error:', error);
    res.redirect('/user/budgets?error=Failed to delete budget');
  }
}));

// ======== PLANNED EXPENSES ROUTES ========

router.get('/planned-expenses', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  const plannedExpenses = await safeQuery(`
    SELECT * FROM planned_expenses 
    WHERE user_id = ? 
    ORDER BY planned_date ASC
  `, [userId]);

  const plannedExpensesArray = Array.isArray(plannedExpenses) ? plannedExpenses : [];

  const notificationRows = await db.execute(
    `SELECT COUNT(*) AS notificationCount 
     FROM notifications 
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  const notificationData = getFirstRow(notificationRows);
  const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

  res.render('individualUser/planned-expenses/list', {
    title: 'Planned Expenses',
    user: req.user,
    currentPage: 'planned-expenses',
    plannedExpenses: plannedExpensesArray,
    notificationCount: notificationCount,
    success: req.query.success || false,
    message: req.query.message || '',
    error: req.query.error || ''
  });
}));

router.get('/planned-expenses/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  const notificationRows = await db.execute(
    `SELECT COUNT(*) AS notificationCount 
     FROM notifications 
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  const notificationData = getFirstRow(notificationRows);
  const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

  res.render('individualUser/planned-expenses/add', {
    title: 'Plan New Expense',
    user: req.user,
    currentPage: 'planned-expenses',
    formData: {},
    notificationCount: notificationCount,
    error: req.query.error || ''
  });
}));

router.post('/planned-expenses/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { amount, description, category, planned_date, recurrence } = req.body;

  const result = await safeQuery(`
    INSERT INTO planned_expenses 
    (user_id, amount, description, category, planned_date, recurrence, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'planned', NOW())
  `, [userId, parseFloat(amount), description, category, planned_date, recurrence]);

  if (result?.affectedRows > 0) {
    return res.redirect('/user/planned-expenses?success=true&message=Planned expense added');
  }

  res.render('individualUser/planned-expenses/add', {
    title: 'Plan New Expense',
    user: req.user,
    currentPage: 'planned-expenses',
    formData: req.body,
    notificationCount: 0,
    error: 'Failed to add planned expense'
  });
}));

// ======== NOTIFICATIONS ROUTES ========

// GET Notifications page (FIXED VERSION)
// router.get('/notifications', asyncHandler(async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const db = require('../config/db');

//     console.log('🔔 Fetching notifications for user:', userId);
    
//     // Get notifications - your MySQL2 returns data directly as array
//     const notifications = await db.execute(
//       `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
//       [userId]
//     );

//     console.log('📨 Notifications found:', notifications.length);

//     // Get notification count
//     const countResult = await db.execute(
//       `SELECT COUNT(*) AS notificationCount FROM notifications WHERE user_id = ? AND is_read = 0`,
//       [userId]
//     );
    
//     const countData = getFirstRow(countResult);
//     const notificationCount = parseInt(countData?.notificationCount, 10) || 0;

//     // Mark notifications as read when viewed
//     if (notifications.length > 0) {
//       await db.execute(
//         `UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false`,
//         [userId]
//       );
//       console.log('✅ Notifications marked as read');
//     }

//     res.render('individualUser/', {
//       title: 'Notifications',
//       user: req.user,
//       currentPage: 'notifications',
//       notifications: notifications,
//       notificationCount: notificationCount,
//       success: req.query.success || false,
//       message: req.query.message || '',
//       error: req.query.error || ''
//     });

//   } catch (error) {
//     console.error('❌ Error in notifications route:', error);
//     res.render('individualUser/notifications', {
//       title: 'Notifications',
//       user: req.user,
//       currentPage: 'notifications',
//       notifications: [],
//       notificationCount: 0,
//       error: 'Failed to load notifications'
//     });
//   }
// }));
// ======== NOTIFICATIONS ROUTES ========

// GET Notifications page (FIXED VIEW PATH)
router.get('/notifications', asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const db = require('../config/db');

    console.log('🔔 Fetching notifications for user:', userId);
    
    // Get notifications - your MySQL2 returns data directly as array
    const notifications = await db.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    console.log('📨 Notifications found:', notifications.length);

    // Get notification count
    const countResult = await db.execute(
      `SELECT COUNT(*) AS notificationCount FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    
    const countData = getFirstRow(countResult);
    const notificationCount = parseInt(countData?.notificationCount, 10) || 0;

    // Mark notifications as read when viewed
    if (notifications.length > 0) {
      await db.execute(
        `UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false`,
        [userId]
      );
      console.log('✅ Notifications marked as read');
    }

    // FIXED: Using the correct view path
    res.render('individualUser/notifications/list', {
      title: 'Notifications',
      user: req.user,
      currentPage: 'notifications',
      notifications: notifications,
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Error in notifications route:', error);
    // FIXED: Using the correct view path
    res.render('individualUser/notifications/list', {
      title: 'Notifications',
      user: req.user,
      currentPage: 'notifications',
      notifications: [],
      notificationCount: 0,
      error: 'Failed to load notifications'
    });
  }
}));
// POST Mark single notification as read
router.post('/notifications/mark-read/:id', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    await db.execute(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.redirect('/user/notifications?success=Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.redirect('/user/notifications?error=Failed to mark notification as read');
  }
}));

// POST Mark all notifications as read
router.post('/notifications/mark-all-read', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    await db.execute(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [req.user.id]
    );
    res.redirect('/user/notifications?success=All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.redirect('/user/notifications?error=Failed to mark all notifications as read');
  }
}));

// POST Delete single notification
router.post('/notifications/delete/:id', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    await db.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.redirect('/user/notifications?success=Notification deleted');
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.redirect('/user/notifications?error=Failed to delete notification');
  }
}));

// POST Clear all notifications
router.post('/notifications/clear-all', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    await db.execute(
      'DELETE FROM notifications WHERE user_id = ?',
      [req.user.id]
    );
    res.redirect('/user/notifications?success=All notifications cleared');
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.redirect('/user/notifications?error=Failed to clear all notifications');
  }
}));

// ======== DEBUG ROUTES ========

// Debug route to check MySQL2 structure
router.get('/debug-notifications-simple', asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const db = require('../config/db');

    const result = await db.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      rawResult: result,
      userId: userId,
      resultType: typeof result,
      isArray: Array.isArray(result),
      length: result.length
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.json({ error: error.message });
  }
}));

// Emergency fallback test
router.get('/notifications-test', asyncHandler(async (req, res) => {
  try {
    console.log('🚨 EMERGENCY: Using hardcoded notifications test');
    
    const notifications = [
      {
        id: 1,
        user_id: req.user.id,
        title: 'Test Notification 1',
        message: 'This is a test notification to verify the page works.',
        type: 'info',
        is_read: 0,
        created_at: new Date()
      }
    ];

    res.render('individualUser/notifications', {
      title: 'Notifications',
      user: req.user,
      currentPage: 'notifications',
      notifications: notifications,
      notificationCount: 1,
      success: true,
      message: 'Using test data - page is working!'
    });

  } catch (error) {
    console.error('❌ EMERGENCY - Fatal error:', error);
    res.send(`
      <h1>Notifications</h1>
      <p>Emergency fallback - page is rendering!</p>
      <p>Error: ${error.message}</p>
      <a href="/user/dashboard">Back to Dashboard</a>
    `);
  }
}));
// DEBUG: Check table structures
router.get('/debug-tables', asyncHandler(async (req, res) => {
  try {
    const db = require('../config/db');
    
    const tables = ['savings_goals', 'expenses', 'budgets', 'planned_expenses', 'notifications'];
    const results = {};
    
    for (const table of tables) {
      try {
        const [structure] = await db.execute(`DESCRIBE ${table}`);
        results[table] = structure;
      } catch (error) {
        results[table] = { error: error.message };
      }
    }
    
    res.json(results);
  } catch (error) {
    res.json({ error: error.message });
  }
}));

module.exports = router;