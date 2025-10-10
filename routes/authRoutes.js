const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validateMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Login routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Register routes
router.get('/register', authController.getRegister);
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim()
  ],
  validate([
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim()
  ]),
  authController.postRegister
);

// Logout route
router.get('/logout', authenticate, authController.logout);
router.post('/logout', authenticate, authController.logout);



// Profile routes
router.get('/profile', authenticate, authController.getProfile);
router.post('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
