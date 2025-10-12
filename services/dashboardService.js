const db = require('../config/db');

const dashboardService = {
  // Data common to all roles
  getCommonData: async (userId) => {
    try {
      const [totalSavingsRow] = await db.execute(
        `SELECT COALESCE(SUM(current_amount),0) AS total FROM savings_goals WHERE user_id = ?`,
        [userId]
      );

      const [totalExpensesRow] = await db.execute(
        `SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id = ?`,
        [userId]
      );

      const [expensesCountRow] = await db.execute(
        `SELECT COUNT(*) AS count FROM expenses WHERE user_id = ?`,
        [userId]
      );

      return {
        userId,
        totalSavings: parseFloat(totalSavingsRow[0]?.total || 0),
        totalExpenses: parseFloat(totalExpensesRow[0]?.total || 0),
        expensesCount: parseInt(expensesCountRow[0]?.count || 0, 10)
      };
    } catch (e) {
      console.error('Common dashboard data query failed:', e.message);
      return {};
    }
  },

  // Individual user-specific data
  getIndividualUserData: async (userId) => {
    try {
      // Active budgets for current month
      const [activeBudgetsRow] = await db.execute(
        `SELECT COUNT(*) AS count 
         FROM budgets 
         WHERE user_id = ? 
           AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
           AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
        [userId]
      );

      // Planned future expenses
      const [plannedExpensesRow] = await db.execute(
        `SELECT COUNT(*) AS count 
         FROM planned_expenses 
         WHERE user_id = ? AND planned_date >= CURDATE()`,
        [userId]
      );

      // Recent expenses
      const [recentExpensesRows] = await db.execute(
        `SELECT id, description, amount, category, date, created_at 
         FROM expenses 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );

      // Budget vs spent data
      const [activeBudgetsDataRows] = await db.execute(
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

      // Active savings goals
      const [savingsGoalsRows] = await db.execute(
        `SELECT id, name, target_amount, current_amount
         FROM savings_goals
         WHERE user_id = ? AND status='active'`,
        [userId]
      );

      return {
        activeBudgets: parseInt(activeBudgetsRow[0]?.count || 0, 10),
        plannedExpenses: parseInt(plannedExpensesRow[0]?.count || 0, 10),
        recentTransactions: Array.isArray(recentExpensesRows) ? recentExpensesRows : [],
        activeBudgetsData: Array.isArray(activeBudgetsDataRows) ? activeBudgetsDataRows : [],
        savingsGoals: Array.isArray(savingsGoalsRows) ? savingsGoalsRows : []
      };
    } catch (e) {
      console.error('Individual user dashboard data query failed:', e.message);
      return {};
    }
  },

  // Admin-specific data
  getAdminData: async () => {
    return {};
  },

  // Finance manager-specific data
  getFinanceManagerData: async (userId) => {
    return {};
  }
};

module.exports = dashboardService;
