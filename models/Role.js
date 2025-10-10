const db = require('../config/db');

class Role {
  static async findAll() {
    const [rows] = await db.pool.execute('SELECT * FROM roles ORDER BY name');
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByName(name) {
    const [rows] = await db.pool.execute('SELECT * FROM roles WHERE name = ?', [name]);
    return rows[0];
  }

  static async create(roleData) {
    const { name, description } = roleData;
    const [result] = await db.pool.execute(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [name, description]
    );
    return result.insertId;
  }

  static async update(id, roleData) {
    const { name, description } = roleData;
    const [result] = await db.pool.execute(
      'UPDATE roles SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    return result.affectedRows > 0;
  }

  static async getPermissions(roleId) {
    const [rows] = await db.pool.execute(
      `SELECT p.* FROM permissions p 
       JOIN role_permissions rp ON p.id = rp.permission_id 
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return rows;
  }

  static async assignPermission(roleId, permissionId) {
    try {
      await db.pool.execute(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [roleId, permissionId]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async removePermission(roleId, permissionId) {
    const [result] = await db.pool.execute(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [roleId, permissionId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Role;