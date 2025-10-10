const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/individualUser/dashboardController');
const expenseController = require('../controllers/individualUser/expenseController');
const plannedExpenseController = require('../controllers/individualUser/plannedExpenseController');
const budgetController = require('../controllers/individualUser/budgetController');
const savingsController = require('../controllers/individualUser/savingsController');
const notificationController = require('../controllers/individualUser/notificationController');

const router = express.Router();

router.use(authenticate, requireRole('individual_user')); // ✅ CORRECT - string

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

// Budget Management
router.get('/budgets', budgetController.getBudgets);
router.get('/budgets/add', budgetController.getAddBudget);
router.post('/budgets/add', budgetController.postAddBudget);
router.get('/budgets/edit/:id', budgetController.getEditBudget);
router.post('/budgets/edit/:id', budgetController.postEditBudget);
router.post('/budgets/delete/:id', budgetController.deleteBudget);

// Savings Management
router.get('/savings', savingsController.getSavings);
router.get('/savings/add', savingsController.getAddSavings);
router.post('/savings/add', savingsController.postAddSavings);
router.get('/savings/edit/:id', savingsController.getEditSavings);
router.post('/savings/edit/:id', savingsController.postEditSavings);
router.post('/savings/delete/:id', savingsController.deleteSavings);
router.post('/savings/add-amount/:id', savingsController.addToSavings);

// Notifications
router.get('/notifications', notificationController.getNotifications);

module.exports = router;