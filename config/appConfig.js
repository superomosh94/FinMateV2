module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TEAM_LEADER: 'team_leader',
    TEAM_MEMBER: 'team_member',
    INDIVIDUAL_USER: 'individual_user'
  },

  PERMISSIONS: {
    // User Management
    MANAGE_ALL_USERS: 'manage_all_users',
    MANAGE_TEAM_USERS: 'manage_team_users',
    VIEW_USERS: 'view_users',
    
    // Role Management
    MANAGE_ROLES: 'manage_roles',
    VIEW_ROLES: 'view_roles',
    
    // Permission Management
    MANAGE_PERMISSIONS: 'manage_permissions',
    VIEW_PERMISSIONS: 'view_permissions',
    
    // Expense Management
    MANAGE_ALL_EXPENSES: 'manage_all_expenses',
    MANAGE_TEAM_EXPENSES: 'manage_team_expenses',
    MANAGE_OWN_EXPENSES: 'manage_own_expenses',
    VIEW_EXPENSES: 'view_expenses',
    
    // Budget Management
    MANAGE_ALL_BUDGETS: 'manage_all_budgets',
    MANAGE_TEAM_BUDGETS: 'manage_team_budgets',
    MANAGE_OWN_BUDGETS: 'manage_own_budgets',
    VIEW_BUDGETS: 'view_budgets',
    
    // Team Management
    MANAGE_TEAMS: 'manage_teams',
    VIEW_TEAMS: 'view_teams',
    
    // Savings Management
    MANAGE_SAVINGS: 'manage_savings',
    VIEW_SAVINGS: 'view_savings',
    
    // Notifications
    MANAGE_NOTIFICATIONS: 'manage_notifications',
    VIEW_NOTIFICATIONS: 'view_notifications'
  },

  EXPENSE_CATEGORIES: [
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Education',
    'Bills & Utilities',
    'Travel',
    'Other'
  ],

  BUDGET_PERIODS: ['daily', 'weekly', 'monthly', 'yearly'],

  EXPENSE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },

  PLANNED_EXPENSE_STATUS: {
    PLANNED: 'planned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }
};