// routes/teamLeaderRoutes.js
const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['team_leader', 'admin', 'super_admin']));

// Dashboard - Render EJS template
router.get('/dashboard', (req, res) => {
  console.log('👥 Team Leader dashboard accessed by:', req.user.email);
  
  res.render('teamLeader/dashboard', {
    title: 'Team Leader Dashboard - FinMate',
    user: req.user,
    stats: {
      activeMembers: 8,
      pendingExpenses: 3,
      totalExpenses: 24,
      totalSpent: 2890.50,
      plannedExpenses: 5
    },
    recentExpenses: [
      {
        amount: 150.00,
        description: 'Office supplies',
        category: 'Office',
        date: '2024-01-15',
        status: 'approved'
      },
      {
        amount: 89.99,
        description: 'Team lunch',
        category: 'Food',
        date: '2024-01-14',
        status: 'pending'
      },
      {
        amount: 45.50,
        description: 'Software subscription',
        category: 'Software',
        date: '2024-01-13',
        status: 'approved'
      }
    ],
    team: {
      name: 'Development Team',
      leader_name: `${req.user.first_name} ${req.user.last_name}`
    }
  });
});

// Main Pages - Render EJS templates
router.get('/teams', (req, res) => {
  res.render('teamLeader/teams', {
    title: 'Team Management - FinMate',
    user: req.user
  });
});

router.get('/expenses', (req, res) => {
  res.render('teamLeader/expenses', {
    title: 'Expense Management - FinMate',
    user: req.user
  });
});

router.get('/planned-expenses', (req, res) => {
  res.render('teamLeader/planned-expenses', {
    title: 'Planned Expenses - FinMate',
    user: req.user
  });
});

router.get('/budgets', (req, res) => {
  res.render('teamLeader/budgets', {
    title: 'Budget Management - FinMate',
    user: req.user
  });
});

router.get('/members', (req, res) => {
  res.render('teamLeader/members', {
    title: 'Team Members - FinMate',
    user: req.user
  });
});

router.get('/reports', (req, res) => {
  res.render('teamLeader/reports', {
    title: 'Reports - FinMate',
    user: req.user
  });
});

router.get('/notifications', (req, res) => {
  res.render('teamLeader/notifications', {
    title: 'Notifications - FinMate',
    user: req.user
  });
});

// Team management routes
router.get('/teams/edit', (req, res) => {
  res.render('teamLeader/team-edit', {
    title: 'Edit Team - FinMate',
    user: req.user
  });
});

router.post('/teams/edit', (req, res) => {
  // Handle team edit logic here
  res.redirect('/team-leader/teams?success=Team updated successfully');
});

router.get('/teams/settings', (req, res) => {
  res.render('teamLeader/team-settings', {
    title: 'Team Settings - FinMate',
    user: req.user
  });
});

// Member management routes
router.get('/members/add', (req, res) => {
  res.render('teamLeader/member-add', {
    title: 'Add Member - FinMate',
    user: req.user
  });
});

router.post('/members/add', (req, res) => {
  // Handle member add logic here
  res.redirect('/team-leader/members?success=Member added successfully');
});

router.get('/members/edit/:id', (req, res) => {
  res.render('teamLeader/member-edit', {
    title: 'Edit Member - FinMate',
    user: req.user,
    memberId: req.params.id
  });
});

router.post('/members/edit/:id', (req, res) => {
  // Handle member edit logic here
  res.redirect('/team-leader/members?success=Member updated successfully');
});

router.post('/members/remove/:id', (req, res) => {
  // Handle member remove logic here
  res.redirect('/team-leader/members?success=Member removed successfully');
});

router.get('/members/profile/:id', (req, res) => {
  res.render('teamLeader/member-profile', {
    title: 'Member Profile - FinMate',
    user: req.user,
    memberId: req.params.id
  });
});

// Expense management routes
router.get('/expenses/pending', (req, res) => {
  res.render('teamLeader/expenses-pending', {
    title: 'Pending Expenses - FinMate',
    user: req.user
  });
});

router.get('/expenses/approved', (req, res) => {
  res.render('teamLeader/expenses-approved', {
    title: 'Approved Expenses - FinMate',
    user: req.user
  });
});

router.get('/expenses/rejected', (req, res) => {
  res.render('teamLeader/expenses-rejected', {
    title: 'Rejected Expenses - FinMate',
    user: req.user
  });
});

router.get('/expenses/view/:id', (req, res) => {
  res.render('teamLeader/expense-view', {
    title: 'Expense Details - FinMate',
    user: req.user,
    expenseId: req.params.id
  });
});

router.post('/expenses/approve/:id', (req, res) => {
  // Handle expense approval logic here
  res.redirect('/team-leader/expenses?success=Expense approved');
});

router.post('/expenses/reject/:id', (req, res) => {
  // Handle expense rejection logic here
  res.redirect('/team-leader/expenses?success=Expense rejected');
});

router.post('/expenses/comment/:id', (req, res) => {
  // Handle expense comment logic here
  res.redirect(`/team-leader/expenses/view/${req.params.id}?success=Comment added`);
});

router.get('/expenses/export', (req, res) => {
  // Handle export logic here
  res.redirect('/team-leader/expenses?success=Expenses exported');
});

// Planned expenses routes
router.get('/planned-expenses/add', (req, res) => {
  res.render('teamLeader/planned-expense-add', {
    title: 'Add Planned Expense - FinMate',
    user: req.user
  });
});

router.post('/planned-expenses/add', (req, res) => {
  // Handle planned expense add logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense added');
});

router.get('/planned-expenses/edit/:id', (req, res) => {
  res.render('teamLeader/planned-expense-edit', {
    title: 'Edit Planned Expense - FinMate',
    user: req.user,
    expenseId: req.params.id
  });
});

router.post('/planned-expenses/edit/:id', (req, res) => {
  // Handle planned expense edit logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense updated');
});

router.post('/planned-expenses/delete/:id', (req, res) => {
  // Handle planned expense delete logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense deleted');
});

router.post('/planned-expenses/approve/:id', (req, res) => {
  // Handle planned expense approval logic here
  res.redirect('/team-leader/planned-expenses?success=Planned expense approved');
});

router.get('/planned-expenses/calendar', (req, res) => {
  res.render('teamLeader/planned-expenses-calendar', {
    title: 'Calendar View - FinMate',
    user: req.user
  });
});

// Budget management routes
router.get('/budgets/current', (req, res) => {
  res.render('teamLeader/budgets-current', {
    title: 'Current Budgets - FinMate',
    user: req.user
  });
});

router.get('/budgets/create', (req, res) => {
  res.render('teamLeader/budget-create', {
    title: 'Create Budget - FinMate',
    user: req.user
  });
});

router.post('/budgets/create', (req, res) => {
  // Handle budget creation logic here
  res.redirect('/team-leader/budgets?success=Budget created');
});

router.get('/budgets/edit/:id', (req, res) => {
  res.render('teamLeader/budget-edit', {
    title: 'Edit Budget - FinMate',
    user: req.user,
    budgetId: req.params.id
  });
});

router.post('/budgets/edit/:id', (req, res) => {
  // Handle budget edit logic here
  res.redirect('/team-leader/budgets?success=Budget updated');
});

router.post('/budgets/delete/:id', (req, res) => {
  // Handle budget delete logic here
  res.redirect('/team-leader/budgets?success=Budget deleted');
});

router.get('/budgets/analytics/:id', (req, res) => {
  res.render('teamLeader/budget-analytics', {
    title: 'Budget Analytics - FinMate',
    user: req.user,
    budgetId: req.params.id
  });
});

router.get('/budgets/usage', (req, res) => {
  res.render('teamLeader/budget-usage', {
    title: 'Budget Usage - FinMate',
    user: req.user
  });
});

// Reports routes
router.get('/reports/expenses', (req, res) => {
  res.render('teamLeader/reports-expenses', {
    title: 'Expense Reports - FinMate',
    user: req.user
  });
});

router.get('/reports/budgets', (req, res) => {
  res.render('teamLeader/reports-budgets', {
    title: 'Budget Reports - FinMate',
    user: req.user
  });
});

router.get('/reports/team-performance', (req, res) => {
  res.render('teamLeader/reports-team-performance', {
    title: 'Team Performance - FinMate',
    user: req.user
  });
});

router.get('/reports/export/:type', (req, res) => {
  // Handle report export logic here
  res.redirect('/team-leader/reports?success=Report exported');
});

router.get('/reports/analytics', (req, res) => {
  res.render('teamLeader/reports-analytics', {
    title: 'Analytics - FinMate',
    user: req.user
  });
});

// Notifications routes
router.post('/notifications/mark-read/:id', (req, res) => {
  // Handle mark as read logic here
  res.redirect('/team-leader/notifications?success=Notification marked as read');
});

router.post('/notifications/mark-all-read', (req, res) => {
  // Handle mark all as read logic here
  res.redirect('/team-leader/notifications?success=All notifications marked as read');
});

router.get('/notifications/settings', (req, res) => {
  res.render('teamLeader/notifications-settings', {
    title: 'Notification Settings - FinMate',
    user: req.user
  });
});

router.post('/notifications/settings', (req, res) => {
  // Handle notification settings update logic here
  res.redirect('/team-leader/notifications/settings?success=Settings updated');
});

// Additional routes
router.get('/settings', (req, res) => {
  res.render('teamLeader/settings', {
    title: 'Team Leader Settings - FinMate',
    user: req.user
  });
});

router.get('/profile', (req, res) => {
  res.render('teamLeader/profile', {
    title: 'Team Leader Profile - FinMate',
    user: req.user
  });
});

router.get('/quick-actions', (req, res) => {
  res.render('teamLeader/quick-actions', {
    title: 'Quick Actions - FinMate',
    user: req.user
  });
});

// API endpoints (keep as JSON for frontend)
router.get('/api/team-stats', (req, res) => {
  res.json({ 
    active_members: 8, 
    total_expenses: 24, 
    total_spent: 2890.50, 
    pending_expenses: 3 
  });
});

router.get('/api/expense-summary', (req, res) => {
  res.json({ 
    total: 2890.50, 
    approved: 2450.25, 
    pending: 340.25, 
    rejected: 100.00 
  });
});

router.get('/api/budget-overview', (req, res) => {
  res.json({ 
    total_budgets: 5, 
    total_amount: 15000, 
    total_spent: 8900 
  });
});

router.get('/api/member-performance', (req, res) => {
  res.json([
    { name: 'John Doe', expenses: 12, amount: 1250 },
    { name: 'Jane Smith', expenses: 8, amount: 890 },
    { name: 'Mike Johnson', expenses: 4, amount: 450 }
  ]);
});

module.exports = router;