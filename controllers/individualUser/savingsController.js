const db = require('../../config/db');

const savingsController = {
  getSavings: async (req, res) => {
    try {
      const userId = req.user.id;

      const [savings] = await db.pool.execute(
        `SELECT s.* 
         FROM savings s 
         WHERE s.user_id = ? 
         ORDER BY s.created_at DESC`,
        [userId]
      );

      // Calculate progress percentage for each savings goal
      savings.forEach(goal => {
        goal.progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
      });

      res.render('individualUser/savings/index', {
        title: 'My Savings Goals - FinMate',
        savings,
        user: req.user
      });
    } catch (error) {
      console.error('Get savings error:', error);
      res.render('individualUser/savings/index', {
        title: 'My Savings Goals - FinMate',
        savings: [],
        user: req.user
      });
    }
  },

  getAddSavings: (req, res) => {
    res.render('individualUser/savings/add', {
      title: 'Add Savings Goal - FinMate',
      user: req.user
    });
  },

  postAddSavings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { goal_name, target_amount, current_amount, target_date } = req.body;

      await db.pool.execute(
        `INSERT INTO savings (user_id, goal_name, target_amount, current_amount, target_date) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, goal_name, target_amount, current_amount || 0, target_date || null]
      );

      res.redirect('/user/savings');
    } catch (error) {
      console.error('Add savings error:', error);
      res.render('individualUser/savings/add', {
        title: 'Add Savings Goal - FinMate',
        user: req.user,
        error: 'An error occurred while adding savings goal'
      });
    }
  },

  getEditSavings: async (req, res) => {
    try {
      const savingsId = req.params.id;
      const userId = req.user.id;

      const [savings] = await db.pool.execute(
        'SELECT * FROM savings WHERE id = ? AND user_id = ?',
        [savingsId, userId]
      );

      if (savings.length === 0) {
        return res.redirect('/user/savings');
      }

      res.render('individualUser/savings/edit', {
        title: 'Edit Savings Goal - FinMate',
        saving: savings[0],
        user: req.user
      });
    } catch (error) {
      console.error('Get edit savings error:', error);
      res.redirect('/user/savings');
    }
  },

  postEditSavings: async (req, res) => {
    try {
      const savingsId = req.params.id;
      const userId = req.user.id;
      const { goal_name, target_amount, current_amount, target_date } = req.body;

      await db.pool.execute(
        `UPDATE savings SET goal_name = ?, target_amount = ?, current_amount = ?, target_date = ? 
         WHERE id = ? AND user_id = ?`,
        [goal_name, target_amount, current_amount, target_date || null, savingsId, userId]
      );

      res.redirect('/user/savings');
    } catch (error) {
      console.error('Edit savings error:', error);
      res.redirect('/user/savings');
    }
  },

  deleteSavings: async (req, res) => {
    try {
      const savingsId = req.params.id;
      const userId = req.user.id;

      await db.pool.execute('DELETE FROM savings WHERE id = ? AND user_id = ?', [savingsId, userId]);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Savings goal deleted successfully' });
      }
      
      res.redirect('/user/savings');
    } catch (error) {
      console.error('Delete savings error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error deleting savings goal' });
      }
      
      res.redirect('/user/savings');
    }
  },

  addToSavings: async (req, res) => {
    try {
      const savingsId = req.params.id;
      const userId = req.user.id;
      const { amount } = req.body;

      await db.pool.execute(
        'UPDATE savings SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?',
        [parseFloat(amount), savingsId, userId]
      );

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Amount added to savings successfully' });
      }
      
      res.redirect('/user/savings');
    } catch (error) {
      console.error('Add to savings error:', error);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Error adding to savings' });
      }
      
      res.redirect('/user/savings');
    }
  }
};

module.exports = savingsController;