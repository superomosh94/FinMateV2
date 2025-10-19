const db = require('../../config/db');

const dashboardController = {
  getDashboard: async (req, res) => {
    console.log('GET /super-admin/dashboard');
    try {
      // Get basic stats
      const [userCount] = await db.pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
      const [roleCount] = await db.pool.execute('SELECT COUNT(*) as count FROM roles');
      const [teamCount] = await db.pool.execute('SELECT COUNT(*) as count FROM teams WHERE is_active = TRUE');
      const [expenseCount] = await db.pool.execute('SELECT COUNT(*) as count FROM expenses WHERE is_active = TRUE');

      // Get recent users (required by template)
      const [recentUsers] = await db.pool.execute(
        `SELECT u.username, u.email, r.name as role_name, u.created_at 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.is_active = TRUE 
         ORDER BY u.created_at DESC 
         LIMIT 5`
      );

      // Get role statistics (required by template)
      const [roleStats] = await db.pool.execute(
        `SELECT r.name, COUNT(u.id) as user_count 
         FROM roles r 
         LEFT JOIN users u ON r.id = u.role_id AND u.is_active = TRUE 
         GROUP BY r.id, r.name 
         ORDER BY user_count DESC`
      );

      console.log('📊 Dashboard data loaded:', {
        totalUsers: userCount[0].count,
        totalRoles: roleCount[0].count,
        totalTeams: teamCount[0].count,
        totalExpenses: expenseCount[0].count,
        recentUsersCount: recentUsers.length,
        roleStatsCount: roleStats.length
      });

      res.render('superAdmin/dashboard', {
        title: 'Super Admin Dashboard - FinMate',
        user: req.user,
        stats: {
          totalUsers: userCount[0].count,
          totalRoles: roleCount[0].count,
          totalTeams: teamCount[0].count,
          totalExpenses: expenseCount[0].count
        },
        recentUsers: recentUsers || [],
        roleStats: roleStats || []
      });

    } catch (error) {
      console.error('❌ Dashboard error:', error);
      // Provide fallback data to prevent template errors
      res.render('superAdmin/dashboard', {
        title: 'Super Admin Dashboard - FinMate',
        user: req.user,
        stats: {
          totalUsers: 0,
          totalRoles: 0,
          totalTeams: 0,
          totalExpenses: 0
        },
        recentUsers: [],
        roleStats: []
      });
    }
  }
};

module.exports = dashboardController;