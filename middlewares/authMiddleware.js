const { verifyToken } = require('../config/jwt');
const db = require('../config/db');
const { ROLES } = require('../config/appConfig');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.redirect('/auth/login');
    }

    const decoded = verifyToken(token);
    
    // Get user with role information
    const [users] = await db.pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.is_active = TRUE`,
      [decoded.userId]
    );

    if (users.length === 0) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
};

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role_name)) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

const requireRole = (role) => {
  return authorize([role]);
};

const requireAnyRole = (roles) => {
  return authorize(roles);
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  requireAnyRole
};