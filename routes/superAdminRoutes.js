const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validateMiddleware');
const dashboardController = require('../controllers/superAdmin/dashboardController');
const userController = require('../controllers/superAdmin/userController');
const roleController = require('../controllers/superAdmin/roleController');
const permissionController = require('../controllers/superAdmin/permissionController');
const notificationController = require('../controllers/superAdmin/notificationController');

const router = express.Router();

// All routes require super admin role
router.use(authenticate, requireRole(['super_admin']));

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// User Management
router.get('/users', userController.getUsers);
router.get('/users/add', userController.getAddUser);
router.post('/users/add', 
  [
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('role_id').isInt({ min: 1 })
  ],
  validate,
  userController.postAddUser
);
router.get('/users/edit/:id', userController.getEditUser);
router.post('/users/edit/:id', 
  [
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('role_id').isInt({ min: 1 })
  ],
  validate,
  userController.postEditUser
);
router.post('/users/delete/:id', userController.deleteUser);

// Role Management
router.get('/roles', roleController.getRoles);
router.get('/roles/edit/:id', roleController.getEditRole);
router.post('/roles/edit/:id', 
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim()
  ],
  validate,
  roleController.postEditRole
);

// Permission Management
router.get('/permissions', permissionController.getPermissions);
router.get('/permissions/edit/:id', permissionController.getEditPermission);
router.post('/permissions/edit/:id', 
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim()
  ],
  validate,
  permissionController.postEditPermission
);

// Notifications
router.get('/notifications', notificationController.getNotifications);

module.exports = router;