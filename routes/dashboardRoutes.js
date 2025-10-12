const express = require('express');
const router = express.Router();

// Root dashboard route - redirect to appropriate dashboard based on role
router.get('/', (req, res) => {
  if (req.user) {
    switch (req.user.role) {
      case 'super_admin':
        return res.redirect('/super-admin/dashboard');
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'team_leader':
        return res.redirect('/team-leader/dashboard');
      case 'team_member':
        return res.redirect('/team-member/dashboard');
      case 'individual_user':
      default:
        return res.redirect('/user/dashboard');
    }
  } else {
    // Not logged in - redirect to login
    res.redirect('/auth/login');
  }
});

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dashboard routes working' });
});

module.exports = router;