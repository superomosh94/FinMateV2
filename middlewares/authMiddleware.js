const { verifyToken } = require('../config/jwt');
const db = require('../config/db');
const { ROLES } = require('../config/appConfig');

const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Authentication attempt for path:', req.path);
    
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ No token found, redirecting to login');
      return res.redirect('/auth/login');
    }

    console.log('🔑 Token found, verifying...');
    const decoded = verifyToken(token);
    
    // Get user with role information
    const [users] = await db.pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.is_active = 1`,
      [decoded.userId]
    );

    if (users.length === 0) {
      console.log('❌ User not found or inactive, clearing token');
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = users[0];
    console.log('✅ User authenticated:', req.user.email, 'Role:', req.user.role_name);
    
    next();
  } catch (error) {
    console.error('💥 Authentication error:', error.message);
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
};

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // 🔥 FIX: Flatten the allowedRoles array to handle nested arrays
    const flatRoles = Array.isArray(allowedRoles) ? allowedRoles.flat(Infinity) : [allowedRoles];
    
    console.log('🎯 Authorization check:', {
      userRole: req.user?.role_name,
      allowedRoles: flatRoles,
      path: req.path
    });

    if (!req.user) {
      console.log('❌ No user in request for authorization');
      return res.redirect('/auth/login');
    }

    if (flatRoles.length > 0 && !flatRoles.includes(req.user.role_name)) {
      console.log('❌ Authorization denied:', {
        userRole: req.user.role_name,
        allowedRoles: flatRoles
      });
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: `You do not have permission to access this resource. Required role: ${flatRoles.join(', ')}. Your role: ${req.user.role_name}`
      });
    }

    console.log('✅ Authorization granted for role:', req.user.role_name);
    next();
  };
};

// 🔥 FIX: Remove the array wrapping to prevent nesting
const requireRole = (role) => {
  console.log('🔧 requireRole created for:', role);
  // Directly pass the role instead of wrapping in array
  return authorize(role);
};

const requireAnyRole = (roles) => {
  console.log('🔧 requireAnyRole created for:', roles);
  return authorize(roles);
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  requireAnyRole
};