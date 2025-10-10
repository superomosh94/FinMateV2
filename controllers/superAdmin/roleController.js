const Role = require('../../models/Role');
const Permission = require('../../models/Permission');
const db = require('../../config/db');

const roleController = {
  getRoles: async (req, res) => {
    try {
      const roles = await Role.findAll();
      
      // Get permissions for each role
      for (let role of roles) {
        role.permissions = await Role.getPermissions(role.id);
      }

      const allPermissions = await Permission.findAll();

      res.render('superAdmin/roles/index', {
        title: 'Manage Roles - FinMate',
        roles,
        allPermissions,
        user: req.user
      });
    } catch (error) {
      console.error('Get roles error:', error);
      res.render('superAdmin/roles/index', {
        title: 'Manage Roles - FinMate',
        roles: [],
        allPermissions: [],
        user: req.user
      });
    }
  },

  getEditRole: async (req, res) => {
    try {
      const roleId = req.params.id;
      const role = await Role.findById(roleId);
      
      if (!role) {
        return res.redirect('/super-admin/roles');
      }

      role.permissions = await Role.getPermissions(role.id);
      const allPermissions = await Permission.findAll();

      res.render('superAdmin/roles/edit', {
        title: 'Edit Role - FinMate',
        role,
        allPermissions,
        user: req.user
      });
    } catch (error) {
      console.error('Get edit role error:', error);
      res.redirect('/super-admin/roles');
    }
  },

  postEditRole: async (req, res) => {
    try {
      const roleId = req.params.id;
      const { name, description, permissions } = req.body;

      // Update role details
      await Role.update(roleId, { name, description });

      // Update permissions
      const currentPermissions = await Role.getPermissions(roleId);
      const currentPermissionIds = currentPermissions.map(p => p.id);
      const newPermissionIds = permissions ? (Array.isArray(permissions) ? permissions : [permissions]).map(Number) : [];

      // Remove permissions that are no longer selected
      for (const permId of currentPermissionIds) {
        if (!newPermissionIds.includes(permId)) {
          await Role.removePermission(roleId, permId);
        }
      }

      // Add new permissions
      for (const permId of newPermissionIds) {
        if (!currentPermissionIds.includes(permId)) {
          await Role.assignPermission(roleId, permId);
        }
      }

      res.redirect('/super-admin/roles');
    } catch (error) {
      console.error('Edit role error:', error);
      res.redirect('/super-admin/roles');
    }
  }
};

module.exports = roleController;