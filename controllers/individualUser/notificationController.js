const db = require('../../config/db');

const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;

      const [notifications] = await db.pool.execute(
        `SELECT n.* 
         FROM notifications n 
         WHERE n.user_id = ? 
         ORDER BY n.created_at DESC 
         LIMIT 50`,
        [userId]
      );

      // Mark notifications as read
      await db.pool.execute(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );

      res.render('individualUser/notifications', {
        title: 'My Notifications - FinMate',
        notifications,
        user: req.user
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.render('individualUser/notifications', {
        title: 'My Notifications - FinMate',
        notifications: [],
        user: req.user
      });
    }
  }
};

module.exports = notificationController;