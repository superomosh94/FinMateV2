const Permission = require('../../models/Permission');
const Role = require('../../models/Role');

const permissionController = {
  getPermissions: async (req, res) => {
    try {
      const permissions = await Permission.findAll();
      
      // Get roles for each permission
      for (let permission of permissions) {
        permission.roles = await Permission.getRoles(permission.id);
      }

      const allRoles = await Role.findAll();

      res.render('superAdmin/permissions/index', {
        title: 'Manage Permissions - FinMate',
        permissions,
        allRoles,
        user: req.user
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      res.render('superAdmin/permissions/index', {
        title: 'Manage Permissions - FinMate',
        permissions: [],
        allRoles: [],
        user: req.user
      });
    }
  },

  getEditPermission: async (req, res) => {
    try {
      const permissionId = req.params.id;
      const permission = await Permission.findById(permissionId);
      
      if (!permission) {
        return res.redirect('/super-admin/permissions');
      }

      permission.roles = await Permission.getRoles(permission.id);
      const allRoles = await Role.findAll();

      res.render('superAdmin/permissions/edit', {
        title: 'Edit Permission - FinMate',
        permission,
        allRoles,
        user: req.user
      });
    } catch (error) {
      console.error('Get edit permission error:', error);
      res.redirect('/super-admin/permissions');
    }
  },

  postEditPermission: async (req, res) => {
    try {
      const permissionId = req.params.id;
      const { name, description } = req.body;

      // For permissions, we typically don't edit much, but here's the basic update
      await db.pool.execute(
        'UPDATE permissions SET name = ?, description = ? WHERE id = ?',
        [name, description, permissionId]
      );

      res.redirect('/super-admin/permissions');
    } catch (error) {
      console.error('Edit permission error:', error);
      res.redirect('/super-admin/permissions');
    }
  }
};

module.exports = permissionController;