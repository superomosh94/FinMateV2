const db = require('../config/db');

class Permission {
  static async findAll() {
    const [rows] = await db.pool.execute('SELECT * FROM permissions ORDER BY name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute('SELECT * FROM permissions WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByName(name) {
    const [rows] = await db.pool.execute('SELECT * FROM permissions WHERE name = ?', [name]);
    return rows[0];
  }

  static async getRoles(permissionId) {
    const [rows] = await db.pool.execute(
      `SELECT r.* FROM roles r 
       JOIN role_permissions rp ON r.id = rp.role_id 
       WHERE rp.permission_id = ?`,
      [permissionId]
    );
    return rows;
  }
}

module.exports = Permission;