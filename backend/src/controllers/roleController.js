const Role = require('../models/Role');
const User = require('../models/User');

// @desc    Obtenir tous les rôles
// @route   GET /api/admin/roles
// @access  Private/Admin
const getRoles = async (req, res) => {
  try {
    const { includeUsers = false } = req.query;
    
    let query = Role.find({ isActive: true }).sort({ level: -1 });
    
    if (includeUsers === 'true') {
      query = query.populate('userCount');
    }
    
    const roles = await query;
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des rôles'
    });
  }
};

// @desc    Obtenir un rôle par ID
// @route   GET /api/admin/roles/:roleId
// @access  Private/Admin
const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const role = await Role.findById(roleId).populate('userCount');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du rôle'
    });
  }
};

// @desc    Créer un nouveau rôle
// @route   POST /api/admin/roles
// @access  Private/Admin
const createRole = async (req, res) => {
  try {
    const { name, description, permissions, level, color, icon } = req.body;
    
    // Vérifier si le nom existe déjà
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Un rôle avec ce nom existe déjà'
      });
    }
    
    const role = new Role({
      name,
      description,
      permissions: permissions || [],
      level: level || 1,
      color: color || '#6B7280',
      icon: icon || 'fas fa-user',
      createdBy: req.user.id
    });
    
    await role.save();
    
    res.status(201).json({
      success: true,
      message: 'Rôle créé avec succès',
      data: role
    });
    
    console.log(`✅ Nouveau rôle créé: ${name} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du rôle'
    });
  }
};

// @desc    Mettre à jour un rôle
// @route   PUT /api/admin/roles/:roleId
// @access  Private/Admin
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions, level, color, icon, isActive } = req.body;
    
    const role = await Role.findById(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }
    
    // Vérifier si le nom existe déjà (sauf pour le rôle actuel)
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name, _id: { $ne: roleId } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          error: 'Un rôle avec ce nom existe déjà'
        });
      }
    }
    
    // Mettre à jour les champs
    if (name) role.name = name;
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    if (level !== undefined) role.level = level;
    if (color) role.color = color;
    if (icon) role.icon = icon;
    if (isActive !== undefined) role.isActive = isActive;
    
    role.updatedBy = req.user.id;
    
    await role.save();
    
    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      data: role
    });
    
    console.log(`✅ Rôle mis à jour: ${role.name} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du rôle'
    });
  }
};

// @desc    Supprimer un rôle
// @route   DELETE /api/admin/roles/:roleId
// @access  Private/Admin
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const role = await Role.findById(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }
    
    // Vérifier si le rôle est utilisé
    const usersWithRole = await User.countDocuments({ roleId });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        error: `Impossible de supprimer ce rôle car ${usersWithRole} utilisateur(s) l'utilisent encore`
      });
    }
    
    // Vérifier si c'est un rôle par défaut
    if (role.isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un rôle par défaut'
      });
    }
    
    await Role.findByIdAndDelete(roleId);
    
    res.json({
      success: true,
      message: 'Rôle supprimé avec succès'
    });
    
    console.log(`✅ Rôle supprimé: ${role.name} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la suppression du rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du rôle'
    });
  }
};

// @desc    Assigner un rôle à un utilisateur
// @route   PUT /api/admin/users/:userId/role
// @access  Private/Admin
const assignRoleToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }
    
    // Mettre à jour le rôle de l'utilisateur
    user.roleId = roleId;
    user.role = role.name; // Synchroniser avec le rôle simple
    
    await user.save();
    
    res.json({
      success: true,
      message: `Rôle ${role.name} assigné avec succès à ${user.nomComplet}`,
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          roleId: user.roleId
        },
        role: {
          id: role._id,
          name: role.name,
          description: role.description,
          level: role.level
        }
      }
    });
    
    console.log(`✅ Rôle ${role.name} assigné à ${user.email} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de l\'assignation du rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'assignation du rôle'
    });
  }
};

// @desc    Initialiser les rôles par défaut
// @route   POST /api/admin/roles/initialize
// @access  Private/Admin
const initializeDefaultRoles = async (req, res) => {
  try {
    const defaultRoles = Role.getDefaultRoles();
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        // Mettre à jour le rôle existant
        existingRole.description = roleData.description;
        existingRole.permissions = roleData.permissions;
        existingRole.level = roleData.level;
        existingRole.color = roleData.color;
        existingRole.icon = roleData.icon;
        existingRole.updatedBy = req.user.id;
        
        await existingRole.save();
        updatedCount++;
      } else {
        // Créer un nouveau rôle
        const role = new Role({
          ...roleData,
          createdBy: req.user.id
        });
        
        await role.save();
        createdCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Initialisation terminée: ${createdCount} rôles créés, ${updatedCount} rôles mis à jour`,
      data: {
        createdCount,
        updatedCount,
        totalRoles: defaultRoles.length
      }
    });
    
    console.log(`✅ Rôles par défaut initialisés par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des rôles:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'initialisation des rôles'
    });
  }
};

// @desc    Obtenir les permissions disponibles
// @route   GET /api/admin/roles/permissions
// @access  Private/Admin
const getAvailablePermissions = async (req, res) => {
  try {
    const permissions = {
      resources: [
        {
          name: 'admin',
          label: 'Administration',
          description: 'Gestion complète de la plateforme',
          actions: ['create', 'read', 'update', 'delete', 'moderate', 'ban', 'unban', 'export', 'view_analytics']
        },
        {
          name: 'formations',
          label: 'Formations',
          description: 'Gestion des formations',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          name: 'users',
          label: 'Utilisateurs',
          description: 'Gestion des utilisateurs',
          actions: ['create', 'read', 'update', 'delete', 'ban', 'unban']
        },
        {
          name: 'reservations',
          label: 'Réservations',
          description: 'Gestion des réservations',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          name: 'comments',
          label: 'Commentaires',
          description: 'Modération des commentaires',
          actions: ['create', 'read', 'update', 'delete', 'moderate']
        },
        {
          name: 'analytics',
          label: 'Analytics',
          description: 'Accès aux statistiques',
          actions: ['read', 'export', 'view_analytics']
        },
        {
          name: 'settings',
          label: 'Paramètres',
          description: 'Configuration de la plateforme',
          actions: ['read', 'update']
        }
      ],
      actions: [
        { name: 'create', label: 'Créer', description: 'Créer de nouveaux éléments' },
        { name: 'read', label: 'Lire', description: 'Consulter les éléments' },
        { name: 'update', label: 'Modifier', description: 'Modifier les éléments existants' },
        { name: 'delete', label: 'Supprimer', description: 'Supprimer les éléments' },
        { name: 'moderate', label: 'Modérer', description: 'Modérer le contenu' },
        { name: 'ban', label: 'Bannir', description: 'Bannir des utilisateurs' },
        { name: 'unban', label: 'Débannir', description: 'Débannir des utilisateurs' },
        { name: 'export', label: 'Exporter', description: 'Exporter des données' },
        { name: 'view_analytics', label: 'Voir Analytics', description: 'Accéder aux statistiques' }
      ]
    };
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des permissions'
    });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  initializeDefaultRoles,
  getAvailablePermissions
};
