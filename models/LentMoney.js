const db = require('../config/db');

class LentMoney {
  static async findAll(filters = {}) {
    let query = `
      SELECT lm.*, u.username as lender_username, u.first_name as lender_first_name, u.last_name as lender_last_name 
      FROM lent_money lm 
      JOIN users u ON lm.lender_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.lender_id) {
      query += ' AND lm.lender_id = ?';
      params.push(filters.lender_id);
    }

    if (filters.status) {
      query += ' AND lm.status = ?';
      params.push(filters.status);
    }

    if (filters.borrower_name) {
      query += ' AND lm.borrower_name LIKE ?';
      params.push(`%${filters.borrower_name}%`);
    }

    query += ' ORDER BY lm.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute(
      `SELECT lm.*, u.username as lender_username, u.first_name as lender_first_name, u.last_name as lender_last_name 
       FROM lent_money lm 
       JOIN users u ON lm.lender_id = u.id 
       WHERE lm.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async create(lentMoneyData) {
    const { lender_id, borrower_name, amount, lent_date, expected_return_date, notes } = lentMoneyData;
    const [result] = await db.pool.execute(
      `INSERT INTO lent_money (lender_id, borrower_name, amount, lent_date, expected_return_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lender_id, borrower_name, amount, lent_date, expected_return_date, notes]
    );
    return result.insertId;
  }

  static async update(id, lentMoneyData) {
    const { borrower_name, amount, lent_date, expected_return_date, returned_date, status, notes } = lentMoneyData;
    const [result] = await db.pool.execute(
      `UPDATE lent_money SET borrower_name = ?, amount = ?, lent_date = ?, expected_return_date = ?, 
       returned_date = ?, status = ?, notes = ? 
       WHERE id = ?`,
      [borrower_name, amount, lent_date, expected_return_date, returned_date, status, notes, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.pool.execute('DELETE FROM lent_money WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async markAsReturned(id, returned_date) {
    const [result] = await db.pool.execute(
      'UPDATE lent_money SET status = "returned", returned_date = ? WHERE id = ?',
      [returned_date, id]
    );
    return result.affectedRows > 0;
  }

  static async getTotalLent(lender_id) {
    const [rows] = await db.pool.execute(
      'SELECT SUM(amount) as total FROM lent_money WHERE lender_id = ? AND status = "lent"',
      [lender_id]
    );
    return rows[0]?.total || 0;
  }

  static async getOverdueLoans(lender_id) {
    const [rows] = await db.pool.execute(
      `SELECT COUNT(*) as count FROM lent_money 
       WHERE lender_id = ? AND status = "lent" AND expected_return_date < CURDATE()`,
      [lender_id]
    );
    return rows[0]?.count || 0;
  }
}

module.exports = LentMoney;