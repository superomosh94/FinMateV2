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
    // console.log('✅ Token decoded, user ID:', decoded.userId);
    
    // Get user with role information
    const [users] = await db.pool.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.is_active = 1`,
      [decoded.userId]
    );

    // console.log('📊 Database query result - users found:', users.length);

    if (users.length === 0) {
      console.log('❌ User not found or inactive, clearing token');
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = users[0];
    // console.log('✅ User authenticated:', {
    //   id: req.user.id,
    //   email: req.user.email,
    //   role_name: req.user.role_name,
    //   is_active: req.user.is_active
    // });
    
    next();
  } catch (error) {
    console.error('💥 Authentication error:', error.message);
    console.error('💥 Error stack:', error.stack);
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
};

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // console.log('🎯 Authorization check:', {
    //   path: req.path,
    //   userRole: req.user?.role_name,
    //   allowedRoles: allowedRoles
    // });

    if (!req.user) {
      console.log('❌ No user in request for authorization');
      return res.redirect('/auth/login');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role_name)) {
      console.log('❌ Authorization denied:', {
        userRole: req.user.role_name,
        allowedRoles: allowedRoles
      });
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: `You do not have permission to access this resource. Required role: ${allowedRoles.join(', ')}. Your role: ${req.user.role_name}`
      });
    }

    // console.log('✅ Authorization granted for role:', req.user.role_name);
    next();
  };
};

const requireRole = (role) => {
  // console.log('🔧 requireRole created for:', role);
  return authorize([role]);
};

const requireAnyRole = (roles) => {
  // console.log('🔧 requireAnyRole created for:', roles);
  return authorize(roles);
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  requireAnyRole
};