// routes/admin.js
const express = require('express');
const { authenticate, authorize, requireAnyRole } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/admin/dashboardController');
const userController = require('../controllers/admin/userController');
const budgetController = require('../controllers/admin/budgetController');
const expenseController = require('../controllers/admin/expenseController');
const notificationController = require('../controllers/admin/notificationController');

const router = express.Router();

// Apply authentication and authorization to all admin routes
router.use(authenticate);
router.use(requireAnyRole(['admin', 'super_admin'])); // Allow both admin and super_admin

// Or use authorize directly:
// router.use(authorize(['admin', 'super_admin']));

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// User Management
router.get('/users', userController.getUsers);
router.get('/users/add', userController.getAddUser);
router.post('/users/add', userController.postAddUser);
router.get('/users/edit/:id', userController.getEditUser);
router.post('/users/edit/:id', userController.postEditUser);
router.post('/users/delete/:id', userController.deleteUser);

// Budget Management
router.get('/budgets', budgetController.getBudgets);
router.get('/budgets/add', budgetController.getAddBudget);
router.post('/budgets/add', budgetController.postAddBudget);
router.get('/budgets/edit/:id', budgetController.getEditBudget);
router.post('/budgets/edit/:id', budgetController.postEditBudget);
router.post('/budgets/delete/:id', budgetController.deleteBudget);

// Expense Management
router.get('/expenses', expenseController.getExpenses);
router.get('/expenses/add', expenseController.getAddExpense);
router.post('/expenses/add', expenseController.postAddExpense);
router.get('/expenses/edit/:id', expenseController.getEditExpense);
router.post('/expenses/edit/:id', expenseController.postEditExpense);
router.post('/expenses/delete/:id', expenseController.deleteExpense);
router.post('/expenses/approve/:id', expenseController.approveExpense);
router.post('/expenses/reject/:id', expenseController.rejectExpense);

// Notifications
router.get('/notifications', notificationController.getNotifications);

module.exports = router;