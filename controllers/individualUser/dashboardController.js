const db = require('../../config/db');

// Service functions for dashboard
const dashboardService = {
  getTotalSavings: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT COALESCE(SUM(current_amount),0) AS total FROM savings WHERE user_id = ?`,
        [userId]
      );
      return parseFloat(rows[0]?.total || 0);
    } catch (e) {
      console.error('Savings query failed:', e.message);
      return 0;
    }
  },

  getTotalExpenses: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT COALESCE(SUM(amount),0) AS total 
         FROM expenses 
         WHERE user_id = ? 
           AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
           AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
        [userId]
      );
      return parseFloat(rows[0]?.total || 0);
    } catch (e) {
      console.error('Expenses sum query failed:', e.message);
      return 0;
    }
  },

  getExpensesCount: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS count FROM expenses WHERE user_id = ?`,
        [userId]
      );
      return parseInt(rows[0]?.count || 0, 10);
    } catch (e) {
      console.error('Expenses count query failed:', e.message);
      return 0;
    }
  },

  getActiveBudgets: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS count
         FROM budgets
         WHERE user_id = ? 
           AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
           AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
        [userId]
      );
      return parseInt(rows[0]?.count || 0, 10);
    } catch (e) {
      console.error('Budgets count query failed:', e.message);
      return 0;
    }
  },

  getPlannedExpenses: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS count
         FROM planned_expenses
         WHERE user_id = ? AND planned_date >= CURDATE()`,
        [userId]
      );
      return parseInt(rows[0]?.count || 0, 10);
    } catch (e) {
      console.error('Planned expenses query failed:', e.message);
      return 0;
    }
  },

  getRecentTransactions: async (userId, limit = 10) => {
    try {
      const safeLimit = parseInt(limit, 10) || 10;
      // MySQL does not allow LIMIT with a placeholder in prepared statements; inject as integer
      const [rows] = await db.execute(
        `SELECT id, description, amount, category, date, created_at
         FROM expenses
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ${safeLimit}`,
        [userId]
      );
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      console.error('Recent transactions query failed:', e.message);
      return [];
    }
  },

  getActiveBudgetsData: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT b.id, b.category, b.amount,
                (SELECT COALESCE(SUM(e.amount),0)
                 FROM expenses e
                 WHERE e.user_id = ? AND e.category = b.category
                   AND MONTH(e.created_at) = MONTH(CURRENT_DATE())
                   AND YEAR(e.created_at) = YEAR(CURRENT_DATE())
                ) AS spent
         FROM budgets b
         WHERE b.user_id = ? 
           AND MONTH(b.created_at) = MONTH(CURRENT_DATE()) 
           AND YEAR(b.created_at) = YEAR(CURRENT_DATE())`,
        [userId, userId]
      );
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      console.error('Active budgets data query failed:', e.message);
      return [];
    }
  },

  getSavingsGoals: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT id, goal_name AS name, target_amount, current_amount
         FROM savings
         WHERE user_id = ? AND target_amount > 0`,
        [userId]
      );
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      console.error('Savings goals query failed:', e.message);
      return [];
    }
  },

  getNotificationCount: async (userId) => {
    try {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ?`,
        [userId]
      );
      return parseInt(rows[0]?.count || 0, 10);
    } catch (e) {
      console.error('Notification count query failed:', e.message);
      return 0;
    }
  }
};

// Controller function
// const getDashboard = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.session?.user?.id;
//     if (!userId) throw new Error('User not authenticated');

//     const dashboardData = {
//       userId,
//       totalSavings: await dashboardService.getTotalSavings(userId),
//       totalExpenses: await dashboardService.getTotalExpenses(userId),
//       expensesCount: await dashboardService.getExpensesCount(userId),
//       activeBudgets: await dashboardService.getActiveBudgets(userId),
//       plannedExpenses: await dashboardService.getPlannedExpenses(userId),
//       recentTransactions: await dashboardService.getRecentTransactions(userId),
//       activeBudgetsData: await dashboardService.getActiveBudgetsData(userId),
//       savingsGoals: await dashboardService.getSavingsGoals(userId)
//     };
//     dashboardData.recentTransactionsCount = dashboardData.recentTransactions.length;

//     const notificationCount = await dashboardService.getNotificationCount(userId);

//     return res.render('individualUser/dashboard', {
//       title: 'Personal Dashboard',
//       user: req.user || req.session?.user || {},
//       currentPage: 'dashboard',
//       data: dashboardData,
//       notificationCount,
//       success: req.query.success || false,
//       message: req.query.message || '',
//       error: req.query.error || ''
//     });
//   } catch (error) {
//     console.error('❌ Dashboard controller error:', error);
//     const emptyData = {
//       userId: null,
//       totalSavings: 0,
//       totalExpenses: 0,
//       activeBudgets: 0,
//       plannedExpenses: 0,
//       expensesCount: 0,
//       recentTransactions: [],
//       activeBudgetsData: [],
//       savingsGoals: [],
//       recentTransactionsCount: 0
//     };
//     return res.render('individualUser/dashboard', {
//       title: 'Personal Dashboard',
//       user: req.user || req.session?.user || {},
//       currentPage: 'dashboard',
//       data: emptyData,
//       notificationCount: 0,
//       error: 'Failed to load dashboard data'
//     });
//   }
// };
const getDashboard = async (req, res) => {
  try {
    // Mock fixed data for testing
    const dashboardData = {
      userId: 1,
      totalSavings: 5000,
      totalExpenses: 12000,
      expensesCount: 8,
      activeBudgets: 3,
      plannedExpenses: 2,
      recentTransactions: [
        { id: 1, description: 'Grocery shopping', amount: 2500, category: 'Food', date: '2025-10-10', created_at: '2025-10-10' },
        { id: 2, description: 'Internet bill', amount: 1500, category: 'Utilities', date: '2025-10-09', created_at: '2025-10-09' }
      ],
      activeBudgetsData: [
        { id: 1, category: 'Food & Dining', amount: 5000, spent: 3200 },
        { id: 2, category: 'Transport', amount: 3000, spent: 1200 }
      ],
      savingsGoals: [
        { id: 1, name: 'Laptop', target_amount: 20000, current_amount: 5000 },
        { id: 2, name: 'Vacation', target_amount: 10000, current_amount: 2500 }
      ],
      recentTransactionsCount: 2
    };

    const notificationCount = 4;

    return res.render('individualUser/dashboard', {
      title: 'Personal Dashboard',
      user: req.user || { name: 'Test User' },
      currentPage: 'dashboard',
      data: dashboardData,
      notificationCount,
      success: true,
      message: 'Test data loaded successfully',
      error: ''
    });
  } catch (error) {
    console.error('❌ Dashboard test render error:', error);
    return res.render('individualUser/dashboard', {
      title: 'Personal Dashboard',
      user: req.user || { name: 'Test User' },
      currentPage: 'dashboard',
      data: {},
      notificationCount: 0,
      error: 'Failed to load test data'
    });
  }
};


module.exports = { getDashboard };
