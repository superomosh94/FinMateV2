// routes/teamMemberRoutes.js
const express = require('express');
const router = express.Router();

console.log('🔍 teamMemberRoutes.js - LOADING');

// Apply authentication and role check
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
router.use(authenticate);
router.use(requireRole('team_member'));

// Test route (keep as JSON)
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Team Member Routes - WORKING!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Dashboard - RENDER EJS TEMPLATE
router.get('/dashboard', (req, res) => {
  res.render('teamMember/dashboard', {
    title: 'Team Member Dashboard - FinMate',
    user: req.user
  });
});

// Expenses - RENDER EJS TEMPLATE (you'll need to create this view later)
router.get('/expenses', (req, res) => {
  res.render('teamMember/expenses', {
    title: 'My Expenses - FinMate',
    user: req.user
  });
});

// Keep other routes as JSON for now, or update them to render EJS templates
router.get('/expenses/add', (req, res) => {
  res.json({ message: 'Add Expense Form' });
});

router.post('/expenses/add', (req, res) => {
  res.json({ message: 'Expense Added' });
});

router.get('/planned-expenses', (req, res) => {
  res.json({ message: 'Planned Expenses' });
});

router.get('/planned-expenses/add', (req, res) => {
  res.json({ message: 'Add Planned Expense Form' });
});

router.post('/planned-expenses/add', (req, res) => {
  res.json({ message: 'Planned Expense Added' });
});

console.log('🔍 teamMemberRoutes.js - LOADED SUCCESSFULLY');

module.exports = router;