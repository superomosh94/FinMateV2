const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/teamLeader/dashboardController');
const teamController = require('../controllers/teamLeader/teamController');
const expenseController = require('../controllers/teamLeader/expenseController');
const plannedExpenseController = require('../controllers/teamLeader/plannedExpenseController');

const router = express.Router();

router.use(authenticate, requireRole(['team_leader']));

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Team Management
router.get('/teams', teamController.getTeams);

// Expense Management
router.get('/expenses', expenseController.getExpenses);
router.post('/expenses/approve/:id', expenseController.approveExpense);
router.post('/expenses/reject/:id', expenseController.rejectExpense);

// Planned Expenses
router.get('/planned-expenses', plannedExpenseController.getPlannedExpenses);

module.exports = router;