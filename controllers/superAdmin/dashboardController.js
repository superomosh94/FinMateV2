// const db = require('../../config/db');

// const dashboardController = {
//   getDashboard: async (req, res) => {
//     try {
//       // Get statistics
//       const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
//       const [roleCount] = await db.pool.execute('SELECT COUNT(*) as count FROM roles');
//       const [teamCount] = await db.pool.execute('SELECT COUNT(*) as count FROM teams');
//       const [expenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses');

//       // Get recent activities
//       const [recentUsers] = await db.pool.execute(
//         `SELECT u.username, u.email, r.name as role_name, u.created_at 
//          FROM users u 
//          JOIN roles r ON u.role_id = r.id 
//          WHERE u.is_active = TRUE 
//          ORDER BY u.created_at DESC 
//          LIMIT 5`
//       );

//       // Get system overview
//       const [roleStats] = await db.pool.execute(
//         `SELECT r.name, COUNT(u.id) as user_count 
//          FROM roles r 
//          LEFT JOIN users u ON r.id = u.role_id AND u.is_active = TRUE 
//          GROUP BY r.id, r.name`
//       );

//       res.render('superAdmin/dashboard', {
//         title: 'Super Admin Dashboard - FinMate',
//         user: req.user,
//         stats: {
//           totalUsers: userCount[0].count,
//           totalRoles: roleCount[0].count,
//           totalTeams: teamCount[0].count,
//           totalExpenses: expenseCount[0].count
//         },
//         recentUsers,
//         roleStats
//       });
//     } catch (error) {
//       console.error('Dashboard error:', error);
//       res.render('superAdmin/dashboard', {
//         title: 'Super Admin Dashboard - FinMate',
//         user: req.user,
//         stats: {},
//         recentUsers: [],
//         roleStats: []
//       });
//     }
//   }
// };

// module.exports = dashboardController;

const db = require('../../config/db');

const dashboardController = {
  getDashboard: async (req, res) => {
    console.log('GET /super-admin/dashboard');
    try {
      // Get basic stats
      const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
      const [roleCount] = await db.pool.execute('SELECT COUNT(*) as count FROM roles');
      const [expenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses');

      res.render('superAdmin/dashboard', {
        title: 'Super Admin Dashboard - FinMate',
        user: req.user,
        stats: {
          totalUsers: userCount[0].count,
          totalRoles: roleCount[0].count,
          totalExpenses: expenseCount[0].count
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.render('superAdmin/dashboard', {
        title: 'Super Admin Dashboard - FinMate',
        user: req.user,
        stats: {}
      });
    }
  }
};

module.exports = dashboardController;