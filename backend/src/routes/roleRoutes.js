const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  initializeDefaultRoles,
  getAvailablePermissions
} = require('../controllers/roleController');

// Import des middlewares
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/activityMiddleware');

// Toutes les routes nécessitent une authentification et des permissions admin
router.use(protect);
router.use(checkPermission('admin', 'read'));

// Routes pour les rôles
router.get('/', getRoles);
router.get('/permissions', getAvailablePermissions);
router.get('/:roleId', getRoleById);
router.post('/', checkPermission('admin', 'create'), createRole);
router.put('/:roleId', checkPermission('admin', 'update'), updateRole);
router.delete('/:roleId', checkPermission('admin', 'delete'), deleteRole);

// Routes spéciales
router.post('/initialize', checkPermission('admin', 'create'), initializeDefaultRoles);
router.put('/users/:userId/assign', checkPermission('users', 'update'), assignRoleToUser);

module.exports = router;
