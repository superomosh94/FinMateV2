const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { safeQuery } = require('../utils/dbHelper');
const { validateExpense } = require('../middlewares/validateMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const incomeRoutes = require('../routes/income');
const plannedPurchaseRoutes = require('../routes/plannedPurchases');

const router = express.Router();

// Helper functions for MySQL2 result handling
const handleMySQL2Result = (result) => {
  return Array.isArray(result) ? result : [];
};

const getFirstRow = (result) => {
  const rows = handleMySQL2Result(result);
  return rows.length > 0 ? rows[0] : null;
};

// MySQL2-based notification count function
const getNotificationCount = async (userId) => {
    try {
        const db = require('../config/db');
        const notificationRows = await db.execute(
            `SELECT COUNT(*) AS notificationCount 
             FROM notifications 
             WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
        const notificationData = getFirstRow(notificationRows);
        return parseInt(notificationData?.notificationCount, 10) || 0;
    } catch (error) {
        console.error('Error getting notification count:', error);
        return 0;
    }
};

// Updated getDashboardData function with daily expense tracking
// Updated getDashboardData function with user-configurable daily expense limit
const getDashboardData = async (userId, role = 'individual_user') => {
  try {
    const db = require('../config/db');

    // Get today's date for daily expense tracking
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // Get current month dates for monthly expenses
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get user's daily expense limit from settings (default to 1000 if not set)
    const dailyLimitRows = await db.execute(
      `SELECT setting_value FROM user_settings 
       WHERE user_id = ? AND setting_key = 'daily_expense_limit'`,
      [userId]
    );
    
    const dailyLimitData = getFirstRow(dailyLimitRows);
    const dailyExpenseLimit = dailyLimitData ? 
      parseFloat(dailyLimitData.setting_value) || 1000 : 1000;

    // All queries without array destructuring
    const dailyExpenseRows = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS dailyExpenses 
       FROM expenses 
       WHERE user_id = ? AND date >= ? AND date <= ?`,
      [userId, startOfToday, endOfToday]
    );

    const monthlyExpenseRows = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS totalExpenses 
       FROM expenses 
       WHERE user_id = ? AND date >= ? AND date <= ?`,
      [userId, startOfMonth, endOfMonth]
    );

    const savingsRows = await db.execute(
      `SELECT COALESCE(SUM(current_amount), 0) AS totalSavings FROM savings_goals WHERE user_id = ?`,
      [userId]
    );

    // Today's transactions
    const todaysTransactionsResult = await db.execute(
      `SELECT id, description, amount, category, date, created_at 
       FROM expenses 
       WHERE user_id = ? AND date >= ? AND date <= ?
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId, startOfToday, endOfToday]
    );

    // Recent transactions (all, for the recent transactions section)
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
    const dailyExpenseData = getFirstRow(dailyExpenseRows);
    const monthlyExpenseData = getFirstRow(monthlyExpenseRows);
    const savingsData = getFirstRow(savingsRows);
    const plannedData = getFirstRow(plannedRows);
    const notificationData = getFirstRow(notificationRows);

    const dailyExpenses = parseFloat(dailyExpenseData?.dailyExpenses) || 0;
    const totalExpenses = parseFloat(monthlyExpenseData?.totalExpenses) || 0;
    const totalSavings = parseFloat(savingsData?.totalSavings) || 0;
    const plannedExpenses = parseInt(plannedData?.plannedExpenses, 10) || 0;
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    // Process arrays
    const safeTodaysTransactions = handleMySQL2Result(todaysTransactionsResult);
    const safeRecentTransactions = handleMySQL2Result(recentTransactionsResult);
    const safeActiveBudgetsData = handleMySQL2Result(activeBudgetsResult);
    const safeSavingsGoals = handleMySQL2Result(savingsGoalsResult);

    // Convert amounts to numbers
    safeTodaysTransactions.forEach(transaction => {
      transaction.amount = parseFloat(transaction.amount) || 0;
    });

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
      // Daily expense tracking
      dailyExpenses: dailyExpenses,
      dailyExpenseLimit: dailyExpenseLimit,
      todaysTransactions: safeTodaysTransactions,
      
      // Monthly data
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
      dailyExpenses: result.dailyExpenses,
      dailyExpenseLimit: result.dailyExpenseLimit,
      totalExpenses: result.totalExpenses,
      totalSavings: result.totalSavings,
      todaysTransactionsCount: result.todaysTransactions.length,
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

// DASHBOARD ROUTE - UPDATED WITH DAILY EXPENSE TRACKING
router.get('/dashboard', asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        const userId = user.id;
        
        console.log('📊 Loading dashboard for user:', user.email);
        
        // Get comprehensive dashboard data including daily expenses
        const dashboardData = await getDashboardData(userId, user.role);

        // console.log('✅ Dashboard data loaded successfully:', {
        //     dailyExpenses: dashboardData.dailyExpenses,
        //     totalExpenses: dashboardData.totalExpenses,
        //     todaysTransactions: dashboardData.todaysTransactions.length,
        //     notificationCount: dashboardData.notificationCount
        // });

        res.render('individualUser/dashboard', {
            title: 'Personal Dashboard',
            user: user,
            currentPage: 'dashboard',
            data: dashboardData,
            notificationCount: dashboardData.notificationCount
        });

    } catch (error) {
        console.error('❌ Dashboard error:', error);
        
        // Fallback data in case of error
        const fallbackData = {
            dailyExpenses: 0,
            dailyExpenseLimit: 1000,
            todaysTransactions: [],
            totalExpenses: 0,
            totalSavings: 0,
            activeBudgets: 0,
            plannedExpenses: 0,
            recentTransactions: [],
            activeBudgetsData: [],
            savingsGoals: [],
            notificationCount: 0
        };

        res.render('individualUser/dashboard', {
            title: 'Personal Dashboard',
            user: req.user,
            currentPage: 'dashboard',
            data: fallbackData,
            notificationCount: 0,
            error: 'Unable to load complete dashboard data'
        });
    }
}));

// Individual User Profile route
router.get('/profile', asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    // Get notification count for profile page
    const db = require('../config/db');
    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [user.id]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/profile', {
      title: 'My Profile',
      user: user,
      currentPage: 'profile',
      notificationCount: notificationCount
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).render('error', {
      error: 'Failed to load profile',
      user: req.user
    });
  }
}));

// ======== SAVINGS ROUTES ========

// GET Savings page (FIXED - without description column)
router.get('/savings', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  try {
    // console.log('💰 Fetching savings goals for user:', userId);
    
    // FIXED: Removed description column
    const savingsGoals = await db.execute(
      `SELECT id, name, target_amount, current_amount, target_date, status, created_at, updated_at
       FROM savings_goals 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    const savingsArray = handleMySQL2Result(savingsGoals);

    // console.log('✅ Savings goals loaded:', { count: savingsArray.length });

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

  // console.log('📝 Add savings request:', {
  //   userId,
  //   name,
  //   target_amount,
  //   target_date,
  //   initial_amount
  // });

  try {
    const db = require('../config/db');
    
    // FIXED: Removed description column
    const result = await db.execute(
      `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        userId, 
        name, 
        parseFloat(target_amount), 
        parseFloat(initial_amount) || 0, 
        target_date || null
      ]
    );

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

  // console.log('💰 Add amount to savings:', { savingsId, userId, amount });

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

    const result = await db.execute(
      `UPDATE savings_goals 
       SET current_amount = current_amount + ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [addAmount, savingsId, userId]
    );

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

  // console.log('🔍 Fetching savings goal for edit:', { savingsId, userId });

  try {
    const db = require('../config/db');
    
    const savingsGoals = await db.execute(
      `SELECT * FROM savings_goals WHERE id = ? AND user_id = ?`,
      [savingsId, userId]
    );

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

  // console.log('📝 Edit savings request:', {
  //   savingsId,
  //   userId,
  //   name,
  //   target_amount,
  //   target_date
  // });

  try {
    const db = require('../config/db');
    
    // FIXED: Removed description column
    const result = await db.execute(
      `UPDATE savings_goals 
       SET name = ?, target_amount = ?, target_date = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, parseFloat(target_amount), target_date || null, savingsId, userId]
    );

    if (result.affectedRows > 0) {
      // console.log('🎉 Savings goal updated successfully');
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

  // console.log('🗑️ Delete savings goal:', { savingsId, userId });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(
      `DELETE FROM savings_goals WHERE id = ? AND user_id = ?`,
      [savingsId, userId]
    );

    if (result.affectedRows > 0) {
      // console.log('🎉 Savings goal deleted successfully');
      return res.redirect('/user/savings?success=true&message=Savings goal deleted successfully');
    }

    throw new Error('Savings goal not deleted');
    
  } catch (error) {
    console.error('❌ Delete savings error:', error);
    res.redirect('/user/savings?error=Failed to delete savings goal');
  }
}));




// ======== INCOME ROUTES ========

// Common income sources and categories
const INCOME_SOURCES = [
    'salary', 'freelance', 'business', 'investment', 'rental', 
    'dividends', 'interest', 'gift', 'refund', 'bonus', 'other'
];

const INCOME_CATEGORIES = [
    'wages', 'bonus', 'commission', 'royalties', 'capital-gains',
    'rent', 'interest-income', 'dividend-income', 'gift', 'other-income'
];

// GET User incomes
// Incomes list route - GET /user/incomes
router.get('/incomes', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  try {
    console.log('💰 Fetching incomes for user:', userId);
    
    // Get query parameters for filtering
    const { status, period, showCompleted = 'true' } = req.query;
    
    let query = `SELECT * FROM incomes WHERE user_id = ?`;
    const params = [userId];
    
    // Apply filters (adjust based on your income table structure)
    if (status !== undefined) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (period) {
      query += ` AND period = ?`;
      params.push(period);
    }
    
    if (showCompleted === 'false') {
      query += ` AND status = 0`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const [incomes] = await db.execute(query, params);
    const incomesArray = Array.isArray(incomes) ? incomes : [incomes].filter(Boolean);

    console.log('✅ Incomes loaded:', { count: incomesArray.length });

    // Calculate summary statistics for incomes
    const totalPlanned = incomesArray.reduce((sum, income) => {
      return sum + (parseFloat(income.amount || 0));
    }, 0);

    const pendingCount = incomesArray.filter(i => !i.status).length;
    const completedCount = incomesArray.filter(i => i.status).length;

    // Get notification count
    const [notificationRows] = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationCount = notificationRows && notificationRows[0] ? notificationRows[0].notificationCount : 0;

    res.render('individualUser/incomes/list', {
      title: 'Incomes',
      user: req.user,
      currentPage: 'incomes',
      incomes: incomesArray,
      totalPlanned: totalPlanned, // Make sure this is passed
      pendingCount: pendingCount,
      completedCount: completedCount,
      statusFilter: status || '',
      periodFilter: period || '',
      showCompleted: showCompleted === 'true',
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Incomes route error:', error);
    
    // Fallback data in case of error
    res.render('individualUser/incomes/list', {
      title: 'Incomes',
      user: req.user,
      currentPage: 'incomes',
      incomes: [],
      totalPlanned: 0, // Make sure this is passed even in error case
      pendingCount: 0,
      completedCount: 0,
      statusFilter: '',
      periodFilter: '',
      showCompleted: true,
      notificationCount: 0,
      error: 'Unable to load incomes'
    });
  }
}));

// GET Add Income page
router.get('/incomes/add', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const db = require('../config/db');

    try {
        const notificationCount = await getNotificationCount(userId);

        res.render('individualUser/incomes/add', {
            title: 'Add Income',
            user: req.user,
            currentPage: 'incomes',
            formData: {},
            sources: INCOME_SOURCES,
            categories: INCOME_CATEGORIES,
            notificationCount: notificationCount,
            error: req.query.error || ''
        });

    } catch (error) {
        console.error('❌ Add income page error:', error);
        res.redirect('/user/incomes?error=Failed to load add income page');
    }
}));

// POST Add Income
router.post('/incomes/add', asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { title, amount, description, source, category, received_date, status } = req.body;

    // console.log('📝 Add income request:', {
    //     userId,
    //     title,
    //     amount,
    //     source,
    //     category,
    //     received_date,
    //     status
    // });

    try {
        const db = require('../config/db');
        
        const result = await db.execute(
            `INSERT INTO incomes (user_id, title, amount, description, source, category, received_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, 
                title, 
                parseFloat(amount), 
                description || null, 
                source || null, 
                category || null, 
                received_date || new Date().toISOString().split('T')[0],
                status || 'cleared'
            ]
        );

        if (result.affectedRows > 0) {
            console.log('🎉 Income created successfully');
            return res.redirect('/user/incomes?success=true&message=Income added successfully');
        } else {
            throw new Error('No rows were affected - income not created');
        }
        
    } catch (error) {
        console.error('❌ Add income error:', error);
        
        let errorMessage = 'Failed to add income';
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'An income with this title already exists';
        } else if (error.sqlMessage) {
            errorMessage = `Database error: ${error.sqlMessage}`;
        }

        const notificationCount = await getNotificationCount(userId);

        res.render('individualUser/incomes/add', {
            title: 'Add Income',
            user: req.user,
            currentPage: 'incomes',
            formData: req.body,
            sources: INCOME_SOURCES,
            categories: INCOME_CATEGORIES,
            notificationCount: notificationCount,
            error: errorMessage
        });
    }
}));


// GET Edit Income page
router.get('/incomes/edit/:id', asyncHandler(async (req, res) => {
    const incomeId = req.params.id;
    const userId = req.user.id;

    console.log('🔍 Fetching income for edit:', { incomeId, userId });

    try {
        const db = require('../config/db');
        
        const incomes = await db.execute(
            `SELECT * FROM incomes WHERE id = ? AND user_id = ?`,
            [incomeId, userId]
        );

        const incomeData = handleMySQL2Result(incomes);

        if (incomeData.length === 0) {
            console.log('❌ Income not found');
            return res.redirect('/user/incomes?error=Income not found');
        }

        const notificationCount = await getNotificationCount(userId);

        res.render('individualUser/incomes/edit', {
            title: 'Edit Income',
            user: req.user,
            currentPage: 'incomes',
            income: incomeData[0],
            sources: INCOME_SOURCES,
            categories: INCOME_CATEGORIES,
            notificationCount: notificationCount,
            success: req.query.success || false,
            message: req.query.message || '',
            error: req.query.error || ''
        });

    } catch (error) {
        console.error('❌ Edit income error:', error);
        res.redirect('/user/incomes?error=Failed to load income');
    }
}));

// POST Update Income
router.post('/incomes/edit/:id', asyncHandler(async (req, res) => {
    const incomeId = req.params.id;
    const userId = req.user.id;
    const { title, amount, description, source, category, received_date, status } = req.body;

    // console.log('📝 Edit income request:', {
    //     incomeId,
    //     userId,
    //     title,
    //     amount,
    //     source,
    //     category,
    //     received_date,
    //     status
    // });

    try {
        const db = require('../config/db');
        
        const result = await db.execute(
            `UPDATE incomes 
             SET title = ?, amount = ?, description = ?, source = ?, category = ?, 
                 received_date = ?, status = ?, updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [
                title, 
                parseFloat(amount), 
                description || null, 
                source || null, 
                category || null, 
                received_date,
                status,
                incomeId, 
                userId
            ]
        );

        if (result.affectedRows > 0) {
            console.log('🎉 Income updated successfully');
            return res.redirect('/user/incomes?success=true&message=Income updated successfully');
        } else {
            throw new Error('Income not found or no changes made');
        }
        
    } catch (error) {
        console.error('❌ Update income error:', error);
        res.redirect(`/user/incomes/edit/${incomeId}?error=Failed to update income: ${error.message}`);
    }
}));

// POST Delete Income
router.post('/incomes/delete/:id', asyncHandler(async (req, res) => {
    const incomeId = req.params.id;
    const userId = req.user.id;

    // console.log('🗑️ Delete income:', { incomeId, userId });

    try {
        const db = require('../config/db');
        
        const result = await db.execute(
            `DELETE FROM incomes WHERE id = ? AND user_id = ?`,
            [incomeId, userId]
        );

        if (result.affectedRows > 0) {
            // console.log('🎉 Income deleted successfully');
            return res.redirect('/user/incomes?success=true&message=Income deleted successfully');
        }

        throw new Error('Income not deleted');
        
    } catch (error) {
        console.error('❌ Delete income error:', error);
        res.redirect('/user/incomes?error=Failed to delete income');
    }
}));

// ======== EXPENSES ROUTES ========

router.get('/expenses', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  const expenses = await safeQuery(
    `SELECT * FROM expenses 
     WHERE user_id = ? 
     ORDER BY date DESC, created_at DESC`,
    [userId]
  );

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

  const result = await safeQuery(
    `INSERT INTO expenses (user_id, amount, description, category, date, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
    [userId, parseFloat(amount), description, category, expenseDate]
  );

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
    const expenses = await db.execute(
      `SELECT * FROM expenses WHERE id = ? AND user_id = ?`,
      [expenseId, userId]
    );

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

  // console.log('📝 Edit expense request:', {
  //   expenseId,
  //   userId,
  //   amount,
  //   description,
  //   category,
  //   date
  // });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(
      `UPDATE expenses 
       SET amount = ?, description = ?, category = ?, date = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [parseFloat(amount), description, category, date, expenseId, userId]
    );

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
    
    const result = await db.execute(
      `DELETE FROM expenses WHERE id = ? AND user_id = ?`,
      [expenseId, userId]
    );

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
    const budgets = await db.execute(
      `SELECT 
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
       ORDER BY b.created_at DESC`,
      [userId]
    );

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
    
    const budgets = await safeQuery(
      `SELECT 
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
       ORDER BY created_at DESC`,
      [userId]
    );

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

  // console.log('📝 Add budget request:', {
  //   userId,
  //   category,
  //   amount,
  //   period,
  //   start_date,
  //   end_date
  // });

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

    const result = await db.execute(
      `INSERT INTO budgets (user_id, category, amount, period, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, category, parseFloat(amount), period, mysqlStartDate, mysqlEndDate]
    );

    if (result.affectedRows > 0) {
      // console.log('🎉 Budget created successfully');
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
// POST route to handle budget updates
router.post('/budgets/update/:id', asyncHandler(async (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;
  const { amount, category } = req.body;
  const db = require('../config/db');

  try {
    console.log('📝 Updating budget:', { budgetId, userId, amount, category });

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.redirect(`/user/budgets/edit/${budgetId}?error=Please enter a valid amount`);
    }

    // Check if budget exists and belongs to user
    const budgetCheck = await db.execute(
      `SELECT id FROM budgets WHERE id = ? AND user_id = ?`,
      [budgetId, userId]
    );
    const budgetData = handleMySQL2Result(budgetCheck);

    if (budgetData.length === 0) {
      return res.redirect('/user/budgets?error=Budget not found');
    }

    // Update the budget
    const updateResult = await db.execute(
      `UPDATE budgets SET amount = ?, category = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      [amount, category || null, budgetId, userId]
    );

    // console.log('✅ Budget updated successfully:', updateResult);

    // Redirect with success message
    res.redirect(`/user/budgets/edit/${budgetId}?success=true&message=Budget updated successfully`);

  } catch (error) {
    console.error('❌ Update budget error:', error);
    res.redirect(`/user/budgets/edit/${budgetId}?error=Failed to update budget`);
  }
}));

// POST Update Budget
router.post('/budgets/edit/:id', asyncHandler(async (req, res) => {
  const budgetId = req.params.id;
  const userId = req.user.id;
  const { category, amount, period, start_date, end_date } = req.body;

  // console.log('📝 Edit budget request:', {
  //   budgetId,
  //   category,
  //   amount,
  //   period,
  //   start_date,
  //   end_date
  // });

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
    
    const result = await db.execute(
      `UPDATE budgets 
       SET category = ?, amount = ?, period = ?, start_date = ?, end_date = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [category, parseFloat(amount), period, mysqlStartDate, mysqlEndDate, budgetId, userId]
    );

    if (result.affectedRows > 0) {
      // console.log('🎉 Budget updated successfully');
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
    
    const result = await db.execute(
      `DELETE FROM budgets WHERE id = ? AND user_id = ?`,
      [budgetId, userId]
    );

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

  const plannedExpenses = await safeQuery(
    `SELECT * FROM planned_expenses 
     WHERE user_id = ? 
     ORDER BY planned_date ASC`,
    [userId]
  );

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

  const result = await safeQuery(
    `INSERT INTO planned_expenses 
     (user_id, amount, description, category, planned_date, recurrence, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'planned', NOW())`,
    [userId, parseFloat(amount), description, category, planned_date, recurrence]
  );

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
// ======== UPCOMING EXPENSES ROUTES ========

// In your individualUserRoutes.js file, update the upcoming expenses route:

// GET Upcoming Expenses page
router.get('/upcoming-expenses', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const db = require('../config/db');

  try {
    console.log('🛒 Fetching upcoming expenses for user:', userId);
    
    // Get query parameters for filtering
    const { status, period, showCompleted = 'true' } = req.query;
    
    let query = `SELECT * FROM planned_purchases WHERE user_id = ?`;
    const params = [userId];
    
    // Apply filters
    if (status !== undefined) {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (period) {
      query += ` AND period = ?`;
      params.push(period);
    }
    
    if (showCompleted === 'false') {
      query += ` AND status = 0`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    console.log('📋 Query:', query);
    console.log('🔧 Params:', params);
    
    const upcomingExpenses = await db.execute(query, params);
    console.log('🗄️ Raw MySQL result:', upcomingExpenses);
    
    const upcomingExpensesArray = handleMySQL2Result(upcomingExpenses);
    console.log('📊 Processed expenses:', upcomingExpensesArray);

    // Calculate summary statistics
    const totalPlanned = upcomingExpensesArray.reduce((sum, purchase) => {
      return sum + (parseFloat(purchase.planned_amount || 0) * parseInt(purchase.quantity || 1));
    }, 0);

    const pendingCount = upcomingExpensesArray.filter(p => !p.status).length;
    const completedCount = upcomingExpensesArray.filter(p => p.status).length;

    console.log('📈 Summary stats:', { totalPlanned, pendingCount, completedCount });

    // Get notification count
    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    // Render the template
    res.render('individualUser/upcoming-expenses/list', {
      title: 'Upcoming Expenses',
      user: req.user,
      currentPage: 'upcoming-expenses',
      upcomingExpenses: upcomingExpensesArray,
      totalPlanned: totalPlanned,
      pendingCount: pendingCount,
      completedCount: completedCount,
      statusFilter: status || '',
      periodFilter: period || '',
      showCompleted: showCompleted === 'true',
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Upcoming expenses route error:', error);
    
    // Fallback data in case of error
    res.render('individualUser/upcoming-expenses/list', {
      title: 'Upcoming Expenses',
      user: req.user,
      currentPage: 'upcoming-expenses',
      upcomingExpenses: [],
      totalPlanned: 0,
      pendingCount: 0,
      completedCount: 0,
      statusFilter: '',
      periodFilter: '',
      showCompleted: true,
      notificationCount: 0,
      error: 'Unable to load upcoming expenses'
    });
  }
}));
router.get('/upcoming-expenses/add', asyncHandler(async (req, res) => {
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

    res.render('individualUser/upcoming-expenses/add', {
      title: 'Add Upcoming Expense',
      user: req.user,
      currentPage: 'upcoming-expenses',
      formData: {},
      notificationCount: notificationCount,
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Add upcoming expense page error:', error);
    res.redirect('/user/upcoming-expenses?error=Failed to load add expense page');
  }
}));

router.post('/upcoming-expenses/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title, description, category, planned_amount, quantity, period } = req.body;

  console.log('📝 Add upcoming expense request:', {
    userId,
    title,
    description,
    category,
    planned_amount,
    quantity,
    period
  });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(
      `INSERT INTO planned_purchases 
       (user_id, title, description, category, planned_amount, quantity, period, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId, 
        title,
        description || null,
        category || null,
        parseFloat(planned_amount),
        parseInt(quantity) || 1,
        period || 'month'
      ]
    );

    if (result.affectedRows > 0) {
      // console.log('🎉 Upcoming expense created successfully');
      return res.redirect('/user/upcoming-expenses?success=true&message=Upcoming expense added successfully');
    } else {
      throw new Error('No rows were affected - upcoming expense not created');
    }
    
  } catch (error) {
    console.error('❌ Add upcoming expense error:', error);
    
    let errorMessage = 'Failed to add upcoming expense';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'An upcoming expense with this title already exists';
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

    res.render('individualUser/upcoming-expenses/add', {
      title: 'Add Upcoming Expense',
      user: req.user,
      currentPage: 'upcoming-expenses',
      formData: req.body,
      notificationCount: notificationCount,
      error: errorMessage
    });
  }
}));

// GET Edit Upcoming Expense page
// Edit route - GET /user/upcoming-expenses/edit/:id
router.get('/upcoming-expenses/edit/:id', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const purchaseId = req.params.id;
  const db = require('../config/db');

  try {
    console.log('🔍 DEBUG: Starting edit route');
    console.log('🔍 DEBUG: User ID:', userId);
    console.log('🔍 DEBUG: Purchase ID from params:', purchaseId);
    
    // Get the specific purchase
    const [purchaseRows] = await db.execute(
      `SELECT * FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [purchaseId, userId]
    );

    console.log('🔍 DEBUG: Raw database result:', purchaseRows);
    console.log('🔍 DEBUG: Type of purchaseRows:', typeof purchaseRows);
    console.log('🔍 DEBUG: Is Array:', Array.isArray(purchaseRows));

    let purchase;
    
    // Handle both array and object responses from MySQL2
    if (Array.isArray(purchaseRows)) {
      console.log('🔍 DEBUG: Number of rows found:', purchaseRows.length);
      if (purchaseRows.length === 0) {
        console.log('❌ Purchase not found in database (array empty)');
        return res.redirect('/user/upcoming-expenses?error=Upcoming expense not found');
      }
      purchase = purchaseRows[0];
    } else if (purchaseRows && typeof purchaseRows === 'object') {
      console.log('🔍 DEBUG: Single object returned from database');
      purchase = purchaseRows;
    } else {
      console.log('❌ Purchase not found in database (no data)');
      return res.redirect('/user/upcoming-expenses?error=Upcoming expense not found');
    }

    // Additional check for valid purchase data
    if (!purchase || !purchase.id) {
      console.log('❌ Invalid purchase data structure:', purchase);
      return res.redirect('/user/upcoming-expenses?error=Invalid expense data');
    }

    console.log('🔍 DEBUG: Purchase object to be sent to template:', purchase);
    console.log('🔍 DEBUG: Purchase ID:', purchase.id);
    console.log('🔍 DEBUG: Purchase title:', purchase.title);

    // Get notification count
    let notificationCount = 0;
    try {
      const [notificationRows] = await db.execute(
        `SELECT COUNT(*) AS notificationCount 
         FROM notifications 
         WHERE user_id = ? AND is_read = 0`,
        [userId]
      );
      
      // Handle both array and object responses for notification count
      if (Array.isArray(notificationRows) && notificationRows.length > 0) {
        notificationCount = notificationRows[0].notificationCount || 0;
      } else if (notificationRows && typeof notificationRows === 'object') {
        notificationCount = notificationRows.notificationCount || 0;
      }
    } catch (notifError) {
      console.error('❌ Notification count error:', notifError);
      // Continue without notification count
    }

    console.log('🔍 DEBUG: Rendering template with purchase data...');
    
    res.render('individualUser/upcoming-expenses/edit', {
      title: 'Edit Upcoming Expense',
      user: req.user,
      currentPage: 'upcoming-expenses',
      purchase: purchase,
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Edit purchase route error:', error);
    res.redirect('/user/upcoming-expenses?error=Unable to load expense for editing');
  }
}));
// POST Update Upcoming Expense
router.post('/upcoming-expenses/edit/:id', asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;
  const { title, description, category, planned_amount, quantity, period, status } = req.body;

  // console.log('📝 Edit upcoming expense request:', {
  //   expenseId,
  //   userId,
  //   title,
  //   description,
  //   category,
  //   planned_amount,
  //   quantity,
  //   period,
  //   status
  // });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(
      `UPDATE planned_purchases 
       SET title = ?, description = ?, category = ?, planned_amount = ?, quantity = ?, period = ?, status = ?
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description || null,
        category || null,
        parseFloat(planned_amount),
        parseInt(quantity) || 1,
        period || 'month',
        status ? 1 : 0,
        expenseId, 
        userId
      ]
    );

    if (result.affectedRows > 0) {
      console.log('🎉 Upcoming expense updated successfully');
      return res.redirect('/user/upcoming-expenses?success=true&message=Upcoming expense updated successfully');
    } else {
      throw new Error('Upcoming expense not found or no changes made');
    }
    
  } catch (error) {
    console.error('❌ Update upcoming expense error:', error);
    res.redirect(`/user/upcoming-expenses/edit/${expenseId}?error=Failed to update upcoming expense: ${error.message}`);
  }
}));

// POST Delete Upcoming Expense
router.post('/upcoming-expenses/delete/:id', asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;

  // console.log('🗑️ Delete upcoming expense:', { expenseId, userId });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(
      `DELETE FROM planned_purchases WHERE id = ? AND user_id = ?`,
      [expenseId, userId]
    );

    if (result.affectedRows > 0) {
      console.log('🎉 Upcoming expense deleted successfully');
      return res.redirect('/user/upcoming-expenses?success=true&message=Upcoming expense deleted successfully');
    }

    throw new Error('Upcoming expense not deleted');
    
  } catch (error) {
    console.error('❌ Delete upcoming expense error:', error);
    res.redirect('/user/upcoming-expenses?error=Failed to delete upcoming expense');
  }
}));

// POST Add Planned Purchase (in individualUserRoutes.js)
router.post('/planned-purchases/add', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title, description, category, planned_amount, quantity, period } = req.body;

  console.log('📝 Add planned purchase request:', {
    userId,
    title,
    description,
    category,
    planned_amount,
    quantity,
    period
  });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(
      `INSERT INTO planned_purchases 
       (user_id, title, description, category, planned_amount, quantity, period, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId, 
        title,
        description || null,
        category || null,
        parseFloat(planned_amount),
        parseInt(quantity) || 1,
        period || 'month'
      ]
    );

    if (result.affectedRows > 0) {
      console.log('🎉 Planned purchase created successfully');
      return res.redirect('/user/planned-purchases?success=true&message=Planned purchase added successfully');
    } else {
      throw new Error('No rows were affected - planned purchase not created');
    }
    
  } catch (error) {
    console.error('❌ Add planned purchase error:', error);
    
    let errorMessage = 'Failed to add planned purchase';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'A planned purchase with this title already exists';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    }

    // Get notification count for error page
    const notificationRows = await db.execute(
      `SELECT COUNT(*) AS notificationCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    const notificationData = getFirstRow(notificationRows);
    const notificationCount = parseInt(notificationData?.notificationCount, 10) || 0;

    res.render('individualUser/planned-purchases/add', {
      title: 'Add Planned Purchase',
      user: req.user,
      currentPage: 'planned-purchases',
      formData: req.body,
      notificationCount: notificationCount,
      error: errorMessage
    });
  }
}));

// POST Mark as Completed
router.post('/upcoming-expenses/complete/:id', asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const userId = req.user.id;

  // console.log('✅ Marking upcoming expense as completed:', { expenseId, userId });

  try {
    const db = require('../config/db');
    
    const result = await db.execute(
      `UPDATE planned_purchases SET status = 1 WHERE id = ? AND user_id = ?`,
      [expenseId, userId]
    );

    if (result.affectedRows > 0) {
      console.log('🎉 Upcoming expense marked as completed');
      return res.redirect('/user/upcoming-expenses?success=true&message=Upcoming expense marked as completed');
    }

    throw new Error('Upcoming expense not found');
    
  } catch (error) {
    console.error('❌ Complete upcoming expense error:', error);
    res.redirect('/user/upcoming-expenses?error=Failed to mark expense as completed');
  }
}));
// ======== SETTINGS ROUTES ========

// GET Settings page
router.get('/settings', asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const db = require('../config/db');

    // Get current settings
    const settingsRows = await db.execute(
      `SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?`,
      [userId]
    );

    const settings = {};
    handleMySQL2Result(settingsRows).forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    // Get notification count
    const notificationCount = await getNotificationCount(userId);

    res.render('individualUser/settings', {
      title: 'My Settings',
      user: req.user,
      currentPage: 'settings',
      settings: settings,
      notificationCount: notificationCount,
      success: req.query.success || false,
      message: req.query.message || '',
      error: req.query.error || ''
    });

  } catch (error) {
    console.error('❌ Settings error:', error);
    res.redirect('/user/dashboard?error=Failed to load settings');
  }
}));

// POST Update Settings
router.post('/settings/update', asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { daily_expense_limit, currency, language } = req.body;
    const db = require('../config/db');

    // console.log('⚙️ Updating settings for user:', userId, { daily_expense_limit });

    // Update daily expense limit
    if (daily_expense_limit) {
      const dailyLimit = parseFloat(daily_expense_limit);
      if (dailyLimit > 0) {
        await db.execute(
          `INSERT INTO user_settings (user_id, setting_key, setting_value) 
           VALUES (?, 'daily_expense_limit', ?)
           ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
          [userId, dailyLimit, dailyLimit]
        );
      }
    }

    // You can add more settings here (currency, language, etc.)

    console.log('✅ Settings updated successfully');
    res.redirect('/user/settings?success=true&message=Settings updated successfully');

  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.redirect('/user/settings?error=Failed to update settings');
  }
}));

// ======== NOTIFICATIONS ROUTES ========

// GET Notifications page (FIXED VIEW PATH)
router.get('/notifications', asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const db = require('../config/db');

    // console.log('🔔 Fetching notifications for user:', userId);
    
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
      // console.log('✅ Notifications marked as read');
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

// ======== MOUNT IMPORTED ROUTES ========
// These will handle /user/incomes/* and /user/planned-purchases/* routes
router.use('/incomes', incomeRoutes);
router.use('/planned-purchases', plannedPurchaseRoutes);

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

// ======== DEBUG INCOME ROUTE ========
router.get('/debug-income', asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const db = require('../config/db');
    
    console.log('🔍 Debug income check for user:', userId);
    
    const debugInfo = {
      userId: userId,
      tableExists: false,
      tableStructure: null,
      sampleData: null,
      errors: []
    };

    // Test 1: Check if incomes table exists
    try {
      // Simple test query
      const result = await db.execute('SELECT COUNT(*) as count FROM incomes');
      debugInfo.tableExists = true;
      // console.log('✅ Incomes table exists');
    } catch (tableError) {
      debugInfo.tableExists = false;
      debugInfo.errors.push(`Table check: ${tableError.message}`);
      console.log('❌ Incomes table does not exist:', tableError.message);
    }

    // Test 2: Get table structure if table exists
    if (debugInfo.tableExists) {
      try {
        const structure = await db.execute('DESCRIBE incomes');
        debugInfo.tableStructure = structure;
        // console.log('✅ Table structure retrieved');
      } catch (structureError) {
        debugInfo.errors.push(`Structure: ${structureError.message}`);
      }
    }

    // Test 3: Try to get sample data if table exists
    if (debugInfo.tableExists) {
      try {
        const data = await db.execute('SELECT * FROM incomes WHERE user_id = ? LIMIT 3', [userId]);
        debugInfo.sampleData = data;
        // console.log('✅ Sample data retrieved');
      } catch (dataError) {
        debugInfo.errors.push(`Data query: ${dataError.message}`);
      }
    }

    res.json(debugInfo);

  } catch (error) {
    console.error('❌ Debug route error:', error);
    res.json({ 
      error: 'Debug route failed',
      message: error.message,
      code: error.code
    });
  }
}));

module.exports = router;