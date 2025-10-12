const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { safeQuery } = require('../utils/dbHelper');
const { validateExpense } = require('../middlewares/validateMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

// Add the getDashboardData function right here
const getDashboardData = async (userId, role = 'individual_user') => {
  try {
    // console.log('🔍 getDashboardData called with userId:', userId);
    
    const db = require('../config/db');

    // console.log('📈 Executing expense query...');
    const [expenseRows] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses WHERE user_id = ?`,
      [userId]
    );

    // console.log('💰 Executing savings query...');
    const [savingsRows] = await db.execute(
      `SELECT COALESCE(SUM(current_amount), 0) AS totalSavings FROM savings_goals WHERE user_id = ?`,
      [userId]
    );

    // console.log('💳 Executing recent transactions query...');
    const [recentTransactionsResult] = await db.execute(
      `SELECT id, description, amount, category, date, created_at 
       FROM expenses 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    // console.log('📊 Executing budgets query...');
    const [activeBudgetsResult] = await db.execute(
      `SELECT b.id, b.category, b.amount, 
              COALESCE((SELECT SUM(e.amount) FROM expenses e 
                       WHERE e.user_id = b.user_id AND e.category = b.category 
                       AND MONTH(e.date) = MONTH(CURRENT_DATE()) 
                       AND YEAR(e.date) = YEAR(CURRENT_DATE())), 0) AS spent
       FROM budgets b 
       WHERE b.user_id = ?`,
      [userId]
    );

    // console.log('📅 Executing planned expenses query...');
    const [plannedRows] = await db.execute(
      `SELECT COUNT(*) AS plannedExpenses 
       FROM planned_expenses 
       WHERE user_id = ? AND planned_date >= CURDATE()`,
      [userId]
    );

    // console.log('🎯 Executing savings goals query...');
    const [savingsGoalsResult] = await db.execute(
      `SELECT id, name, target_amount, current_amount, target_date, status 
       FROM savings_goals 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // console.log('🔔 Executing notifications query...');
    const [notificationRows] = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );



    
    // Inspect expenseRows structure
    if (Array.isArray(expenseRows)) {
      console.log('💰 expenseRows IS AN ARRAY:');
      console.log('  - Length:', expenseRows.length);
      if (expenseRows.length > 0) {
        console.log('  - expenseRows[0]:', expenseRows[0]);
        console.log('  - expenseRows[0]?.totalExpenses:', expenseRows[0]?.totalExpenses);
        console.log('  - typeof expenseRows[0]?.totalExpenses:', typeof expenseRows[0]?.totalExpenses);
      } else {
        console.log('  - expenseRows is EMPTY array');
      }
    } else if (expenseRows && typeof expenseRows === 'object') {
      console.log('💰 expenseRows IS AN OBJECT:');
      console.log('  - expenseRows.totalExpenses:', expenseRows.totalExpenses);
      console.log('  - typeof expenseRows.totalExpenses:', typeof expenseRows.totalExpenses);
      console.log('  - Object keys:', Object.keys(expenseRows));
    } else {
      console.log('💰 expenseRows is:', typeof expenseRows, '-', expenseRows);
    }

    // Test different access patterns
    
    // Pattern 1: Array access
    const test1_expense = expenseRows?.[0]?.totalExpenses;
    console.log('  Array access [0]:', test1_expense, 'Type:', typeof test1_expense);
    
    // Pattern 2: Direct object access
    const test2_expense = expenseRows?.totalExpenses;
    console.log('  Direct object access:', test2_expense, 'Type:', typeof test2_expense);
    
    // Pattern 3: Safe access with fallback
    const test3_expense = (Array.isArray(expenseRows) ? expenseRows[0]?.totalExpenses : expenseRows?.totalExpenses);
    console.log  ('  Smart access:', test3_expense, 'Type:', typeof test3_expense);

    // Determine the correct raw values based on structure
    const rawExpense = Array.isArray(expenseRows) ? expenseRows[0]?.totalExpenses : expenseRows?.totalExpenses;
    const rawSavings = Array.isArray(savingsRows) ? savingsRows[0]?.totalSavings : savingsRows?.totalSavings;
    const rawPlanned = Array.isArray(plannedRows) ? plannedRows[0]?.plannedExpenses : plannedRows?.plannedExpenses;
    const rawNotification = Array.isArray(notificationRows) ? notificationRows[0]?.notificationCount : notificationRows?.notificationCount;



    console.log('\n🔍 DEBUG - PARSING TESTS:');
    
    // Test different parsing methods on expense
    const parseTests = [
      { method: 'parseFloat', result: parseFloat(rawExpense) },
      { method: 'Number()', result: Number(rawExpense) },
      { method: 'Unary +', result: +rawExpense },
      { method: 'parseFloat with String()', result: parseFloat(String(rawExpense)) },
      { method: 'Number with String()', result: Number(String(rawExpense)) }
    ];

    parseTests.forEach(test => {
      console.log(`  ${test.method}:`, test.result, 'Type:', typeof test.result, 'isNaN:', isNaN(test.result));
    });

    // Final parsing with fallbacks
    const totalExpenses = !isNaN(parseFloat(rawExpense)) ? parseFloat(rawExpense) : 0;
    const totalSavings = !isNaN(parseFloat(rawSavings)) ? parseFloat(rawSavings) : 0;
    const plannedExpenses = !isNaN(parseInt(rawPlanned, 10)) ? parseInt(rawPlanned, 10) : 0;
    const notificationCount = !isNaN(parseInt(rawNotification, 10)) ? parseInt(rawNotification, 10) : 0;



    // Handle single objects vs arrays properly for other queries
    const safeRecentTransactions = Array.isArray(recentTransactionsResult) ? recentTransactionsResult : (recentTransactionsResult ? [recentTransactionsResult] : []);
    const safeActiveBudgetsData = Array.isArray(activeBudgetsResult) ? activeBudgetsResult : (activeBudgetsResult ? [activeBudgetsResult] : []);
    const safeSavingsGoals = Array.isArray(savingsGoalsResult) ? savingsGoalsResult : (savingsGoalsResult ? [savingsGoalsResult] : []);



    // Convert amounts in transactions and savings goals to numbers
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

  
    console.log(JSON.stringify({
      totalExpenses: result.totalExpenses,
      totalSavings: result.totalSavings,
      recentTransactionsCount: result.recentTransactions.length,
      activeBudgets: result.activeBudgets,
      savingsGoalsCount: result.savingsGoals.length,
      notificationCount: result.notificationCount
    }, null, 2));

    return result;
    
  } catch (error) {
    console.error('❌ getDashboardData error:', error);
    throw error;
  }
};

// ======== APPLY AUTHENTICATION MIDDLEWARE FIRST ========
// Apply authentication and role middleware to all individual user routes
router.use(authenticate, requireRole('individual_user'));

// ======== THEN DEFINE ALL ROUTES ========

// ROOT ROUTE - Redirect to dashboard
router.get('/', (req, res) => {
  res.redirect('/user/dashboard');
});

// DASHBOARD ROUTE - unified (FIXED)
router.get('/dashboard', asyncHandler(async (req, res) => {
  // console.log('🎯 /user/dashboard route HIT!');
  // console.log('👤 User object:', req.user);
  // console.log('🆔 User ID:', req.user?.id);
  // console.log('🔐 Is authenticated?', req.isAuthenticated ? req.isAuthenticated() : 'N/A');
  
  const userId = req.user.id;
  const role = req.user.role || 'individual_user';

  try {
    console.log('📊 Fetching dashboard data for user:', userId);
    const data = await getDashboardData(userId, role);

    console.log('✅ Dashboard data fetched successfully:', {
      totalExpenses: data.totalExpenses,
      totalSavings: data.totalSavings,
      recentTransactionsCount: data.recentTransactions?.length,
      activeBudgets: data.activeBudgets,
      savingsGoalsCount: data.savingsGoals?.length,
      notificationCount: data.notificationCount
    });

    console.log('🎨 Rendering template...');
    
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

    console.log('🔄 Using fallback data due to error');
    
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

// Debug route - MOVED AFTER AUTH MIDDLEWARE
router.get('/debug-user-data', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');
  
  try {
    console.log('🔍 Checking data for user ID:', userId);
    
    const [expenses] = await db.execute('SELECT * FROM expenses WHERE user_id = ?', [userId]);
    const [savings] = await db.execute('SELECT * FROM savings_goals WHERE user_id = ?', [userId]);
    const [budgets] = await db.execute('SELECT * FROM budgets WHERE user_id = ?', [userId]);
    const [planned] = await db.execute('SELECT * FROM planned_expenses WHERE user_id = ?', [userId]);
    const [notifications] = await db.execute('SELECT * FROM notifications WHERE user_id = ?', [userId]);
    
    // console.log('📊 Data found for user', userId, ':');
    // console.log('- Expenses:', expenses.length);
    // console.log('- Savings Goals:', savings.length);
    // console.log('- Budgets:', budgets.length);
    // console.log('- Planned Expenses:', planned.length);
    // console.log('- Notifications:', notifications.length);
    
    res.json({
      userId,
      expenses: {
        count: expenses.length,
        data: expenses
      },
      savings: {
        count: savings.length,
        data: savings
      },
      budgets: {
        count: budgets.length,
        data: budgets
      },
      planned: {
        count: planned.length,
        data: planned
      },
      notifications: {
        count: notifications.length,
        data: notifications
      }
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.json({ error: error.message });
  }
}));

// Test aggregation queries directly - MOVED AFTER AUTH MIDDLEWARE
router.get('/test-aggregation', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');
  
  try {
    // Test expense sum
    const [expenseSum] = await db.execute(
      'SELECT SUM(amount) as total FROM expenses WHERE user_id = ?',
      [userId]
    );
    
    // Test savings sum
    const [savingsSum] = await db.execute(
      'SELECT SUM(current_amount) as total FROM savings_goals WHERE user_id = ?',
      [userId]
    );
    
    // Test individual expenses
    const [individualExpenses] = await db.execute(
      'SELECT id, amount FROM expenses WHERE user_id = ?',
      [userId]
    );
    
    // Test individual savings
    const [individualSavings] = await db.execute(
      'SELECT id, current_amount FROM savings_goals WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      expenseSum: expenseSum[0],
      savingsSum: savingsSum[0],
      individualExpenses,
      individualSavings,
      calculatedExpenseTotal: individualExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
      calculatedSavingsTotal: individualSavings.reduce((sum, saving) => sum + parseFloat(saving.current_amount), 0)
    });
  } catch (error) {
    res.json({ error: error.message });
  }
}));

// EXPENSES ROUTES
router.get('/expenses', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const expenses = await safeQuery(`
    SELECT * FROM expenses 
    WHERE user_id = ? 
    ORDER BY date DESC, created_at DESC
  `, [userId]);

  const expensesArray = Array.isArray(expenses) ? expenses : [];

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
    success: req.query.success,
    message: req.query.message,
    error: req.query.error || ''
  });
}));

router.get('/expenses/add', (req, res) => {
  res.render('individualUser/expenses/add', {
    title: 'Add Expense',
    user: req.user,
    currentPage: 'expenses',
    formData: {},
    error: req.query.error || ''
  });
});

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

// BUDGETS ROUTE
router.get('/budgets', asyncHandler(async (req, res) => {
  const budgets = await safeQuery(`
    SELECT * FROM budgets 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `, [req.user.id]);

  const budgetsArray = Array.isArray(budgets) ? budgets : [];

  res.render('individualUser/budgets/list', {
    title: 'My Budgets',
    user: req.user,
    currentPage: 'budgets',
    budgets: budgetsArray,
    success: req.query.success || false,
    message: req.query.message || '',
    error: req.query.error || ''
  });
}));

// SAVINGS ROUTE
router.get('/savings', asyncHandler(async (req, res) => {
  const savings = await safeQuery(`
    SELECT id, goal_name AS name, target_amount, current_amount, target_date
    FROM savings 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `, [req.user.id]);

  const savingsArray = Array.isArray(savings) ? savings : [];

  res.render('individualUser/savings/list', {
    title: 'My Savings',
    user: req.user,
    currentPage: 'savings',
    savings: savingsArray,
    success: req.query.success || false,
    message: req.query.message || '',
    error: req.query.error || ''
  });
}));

// PLANNED EXPENSES ROUTES
router.get('/planned-expenses', asyncHandler(async (req, res) => {
  const plannedExpenses = await safeQuery(`
    SELECT * FROM planned_expenses 
    WHERE user_id = ? 
    ORDER BY planned_date ASC
  `, [req.user.id]);

  const plannedExpensesArray = Array.isArray(plannedExpenses) ? plannedExpenses : [];

  res.render('individualUser/planned-expenses/list', {
    title: 'Planned Expenses',
    user: req.user,
    currentPage: 'planned-expenses',
    plannedExpenses: plannedExpensesArray,
    success: req.query.success || false,
    message: req.query.message || '',
    error: req.query.error || ''
  });
}));

router.get('/planned-expenses/add', (req, res) => {
  res.render('individualUser/planned-expenses/add', {
    title: 'Plan New Expense',
    user: req.user,
    currentPage: 'planned-expenses',
    formData: {},
    error: req.query.error || ''
  });
});

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
    error: 'Failed to add planned expense'
  });
}));

// NOTIFICATIONS ROUTE
router.get('/notifications', asyncHandler(async (req, res) => {
  const notifications = await safeQuery(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `, [req.user.id]);

  const notificationsArray = Array.isArray(notifications) ? notifications : [];

  res.render('individualUser/notifications', {
    title: 'Notifications',
    user: req.user,
    currentPage: 'notifications',
    notifications: notificationsArray,
    success: req.query.success || false,
    message: req.query.message || '',
    error: req.query.error || ''
  });
}));

// ADD SAMPLE DATA ROUTE (for testing)
router.get('/add-sample-data', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Add sample savings
    await safeQuery(
      'INSERT INTO savings (user_id, current_amount, target_amount, name) VALUES (?, ?, ?, ?)',
      [userId, 1000, 5000, 'Emergency Fund']
    );

    // Add sample expenses
    await safeQuery(
      'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)',
      [userId, 50, 'Groceries', 'Food']
    );
    await safeQuery(
      'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)',
      [userId, 30, 'Bus fare', 'Transport']
    );

    // Add sample transactions
    await safeQuery(
      'INSERT INTO transactions (user_id, description, category, amount) VALUES (?, ?, ?, ?)',
      [userId, 'Supermarket', 'Food', 75.50]
    );
    await safeQuery(
      'INSERT INTO transactions (user_id, description, category, amount) VALUES (?, ?, ?, ?)',
      [userId, 'Gas station', 'Transport', 45.00]
    );

    // Add sample savings goal
    await safeQuery(
      'INSERT INTO savings_goals (user_id, name, target_amount, current_amount) VALUES (?, ?, ?, ?)',
      [userId, 'New Laptop', 1500, 300]
    );

    // Add sample budget
    await safeQuery(
      'INSERT INTO budgets (user_id, name, category, budget_amount, spent_amount) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Monthly Food', 'Food', 400, 150]
    );

    // Add sample notification
    await safeQuery(
      'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)',
      [userId, 'Welcome!', 'Welcome to FinMate', false]
    );

    res.redirect('/user/dashboard?success=true&message=Sample data added successfully');
  } catch (error) {
    console.error('Error adding sample data:', error);
    res.redirect('/user/dashboard?error=Failed to add sample data');
  }
}));

// DEBUG ROUTE (remove in production)
router.get('/debug-db', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const testResults = {
    user: req.user,
    expenses: await safeQuery('SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', [userId]),
    budgets: await safeQuery('SELECT COUNT(*) as count FROM budgets WHERE user_id = ?', [userId]),
    savings: await safeQuery('SELECT COUNT(*) as count FROM savings WHERE user_id = ?', [userId]),
    transactions: await safeQuery('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?', [userId]),
    savings_goals: await safeQuery('SELECT COUNT(*) as count FROM savings_goals WHERE user_id = ?', [userId]),
    notifications: await safeQuery('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [userId])
  };

  res.json(testResults);
}));

module.exports = router;