const db = require('../config/db');

class Expense {
  static async findAll(filters = {}) {
    let query = `
      SELECT e.*, u.username, u.first_name, u.last_name, t.name as team_name 
      FROM expenses e 
      JOIN users u ON e.user_id = u.id 
      LEFT JOIN teams t ON e.team_id = t.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND e.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND e.team_id = ?';
      params.push(filters.team_id);
    }

    if (filters.status) {
      query += ' AND e.status = ?';
      params.push(filters.status);
    }

    if (filters.category) {
      query += ' AND e.category = ?';
      params.push(filters.category);
    }

    if (filters.start_date) {
      query += ' AND e.date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND e.date <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY e.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute(
      `SELECT e.*, u.username, u.first_name, u.last_name, t.name as team_name 
       FROM expenses e 
       JOIN users u ON e.user_id = u.id 
       LEFT JOIN teams t ON e.team_id = t.id 
       WHERE e.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(expenseData) {
    const { user_id, team_id, amount, description, category, date, status } = expenseData;
    const [result] = await db.pool.execute(
      `INSERT INTO expenses (user_id, team_id, amount, description, category, date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, team_id, amount, description, category, date, status || 'pending']
    );
    return result.insertId;
  }

  static async update(id, expenseData) {
    const { amount, description, category, date, status } = expenseData;
    const [result] = await db.pool.execute(
      `UPDATE expenses SET amount = ?, description = ?, category = ?, date = ?, status = ? 
       WHERE id = ?`,
      [amount, description, category, date, status, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.pool.execute('DELETE FROM expenses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getTotalAmount(filters = {}) {
    let query = 'SELECT SUM(amount) as total FROM expenses WHERE 1=1';
    const params = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND team_id = ?';
      params.push(filters.team_id);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.start_date) {
      query += ' AND date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND date <= ?';
      params.push(filters.end_date);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows[0]?.total || 0;
  }

  static async getByCategory(filters = {}) {
    let query = `
      SELECT category, SUM(amount) as total, COUNT(*) as count 
      FROM expenses 
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.team_id) {
      query += ' AND team_id = ?';
      params.push(filters.team_id);
    }

    if (filters.start_date) {
      query += ' AND date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND date <= ?';
      params.push(filters.end_date);
    }

    query += ' GROUP BY category ORDER BY total DESC';

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }
}

module.exports = Expense;