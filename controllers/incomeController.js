const db = require('../config/db');

const incomeController = {
  getIncomes: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      let query = `
        SELECT i.*
        FROM incomes i 
        WHERE i.user_id = ?
      `;
      let params = [req.user.id];

      if (start_date && end_date) {
        query += ' AND i.received_date BETWEEN ? AND ?';
        params.push(start_date, end_date);
      }

      query += ' ORDER BY i.received_date DESC';

      const [incomes] = await db.execute(query, params);
      res.json({ success: true, data: incomes });
    } catch (error) {
      console.error('Get incomes error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getIncomeById: async (req, res) => {
    try {
      const [incomes] = await db.execute(
        'SELECT i.* FROM incomes i WHERE i.id = ? AND i.user_id = ?',
        [req.params.id, req.user.id]
      );

      if (incomes.length === 0) {
        return res.status(404).json({ success: false, message: 'Income not found' });
      }

      res.json({ success: true, data: incomes[0] });
    } catch (error) {
      console.error('Get income error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  createIncome: async (req, res) => {
    try {
      const { title, amount, description, source, category, received_date, status } = req.body;
      
      const [result] = await db.execute(
        `INSERT INTO incomes (user_id, title, amount, description, source, category, received_date, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, title, amount, description, source, category, received_date, status || 'cleared']
      );

      const [newIncome] = await db.execute(
        'SELECT * FROM incomes WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({ success: true, data: newIncome[0], message: 'Income created successfully' });
    } catch (error) {
      console.error('Create income error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  updateIncome: async (req, res) => {
    try {
      const { title, amount, description, source, category, received_date, status } = req.body;
      
      const [result] = await db.execute(
        `UPDATE incomes SET 
          title = ?, amount = ?, description = ?, source = ?, category = ?, 
          received_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND user_id = ?`,
        [title, amount, description, source, category, received_date, status, req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Income not found' });
      }

      const [updatedIncome] = await db.execute(
        'SELECT * FROM incomes WHERE id = ?',
        [req.params.id]
      );

      res.json({ success: true, data: updatedIncome[0], message: 'Income updated successfully' });
    } catch (error) {
      console.error('Update income error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  deleteIncome: async (req, res) => {
    try {
      const [result] = await db.execute(
        'DELETE FROM incomes WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Income not found' });
      }

      res.json({ success: true, message: 'Income deleted successfully' });
    } catch (error) {
      console.error('Delete income error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getIncomeSummary: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      let query = `
        SELECT 
          COUNT(*) as total_incomes,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          status,
          COUNT(*) as status_count
        FROM incomes 
        WHERE user_id = ?
      `;
      let params = [req.user.id];

      if (start_date && end_date) {
        query += ' AND received_date BETWEEN ? AND ?';
        params.push(start_date, end_date);
      }

      query += ' GROUP BY status';

      const [summary] = await db.execute(query, params);
      
      // Get monthly breakdown
      const [monthlyBreakdown] = await db.execute(
        `SELECT 
          YEAR(received_date) as year,
          MONTH(received_date) as month,
          SUM(amount) as total_amount,
          COUNT(*) as income_count
         FROM incomes 
         WHERE user_id = ? 
         GROUP BY YEAR(received_date), MONTH(received_date) 
         ORDER BY year DESC, month DESC 
         LIMIT 12`,
        [req.user.id]
      );

      res.json({ 
        success: true, 
        data: {
          summary,
          monthlyBreakdown
        }
      });
    } catch (error) {
      console.error('Get income summary error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = incomeController;