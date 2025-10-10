const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/teamMember/dashboardController');
const expenseController = require('../controllers/teamMember/expenseController');
const plannedExpenseController = require('../controllers/teamMember/plannedExpenseController');

const router = express.Router();

router.use(authenticate, requireRole(['team_member']));

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Expense Management
router.get('/expenses', expenseController.getExpenses);
router.get('/expenses/add', expenseController.getAddExpense);
router.post('/expenses/add', expenseController.postAddExpense);
router.get('/expenses/edit/:id', expenseController.getEditExpense);
router.post('/expenses/edit/:id', expenseController.postEditExpense);
router.post('/expenses/delete/:id', expenseController.deleteExpense);

// Planned Expenses
router.get('/planned-expenses', plannedExpenseController.getPlannedExpenses);
router.get('/planned-expenses/add', plannedExpenseController.getAddPlannedExpense);
router.post('/planned-expenses/add', plannedExpenseController.postAddPlannedExpense);
router.get('/planned-expenses/edit/:id', plannedExpenseController.getEditPlannedExpense);
router.post('/planned-expenses/edit/:id', plannedExpenseController.postEditPlannedExpense);
router.post('/planned-expenses/delete/:id', plannedExpenseController.deletePlannedExpense);

module.exports = router;