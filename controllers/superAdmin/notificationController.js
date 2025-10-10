const db = require('../../config/db');

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const [notifications] = await db.pool.execute(
        `SELECT n.*, u.username 
         FROM notifications n 
         JOIN users u ON n.user_id = u.id 
         ORDER BY n.created_at DESC 
         LIMIT 100`
      );

      res.render('superAdmin/notifications', {
        title: 'System Notifications - FinMate',
        notifications,
        user: req.user
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.render('superAdmin/notifications', {
        title: 'System Notifications - FinMate',
        notifications: [],
        user: req.user
      });
    }
  }
};

module.exports = notificationController;