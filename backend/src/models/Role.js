const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
    enum: ['formations', 'users', 'reservations', 'comments', 'admin', 'analytics', 'settings']
  },
  actions: [{
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'moderate', 'ban', 'unban', 'export', 'view_analytics']
  }],
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du rôle est requis'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description du rôle est requise'],
    trim: true
  },
  permissions: [permissionSchema],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  color: {
    type: String,
    default: '#6B7280',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  icon: {
    type: String,
    default: 'fas fa-user'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
roleSchema.index({ name: 1 });
roleSchema.index({ level: -1 });
roleSchema.index({ isActive: 1 });

// Méthodes virtuelles
roleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'roleId',
  count: true
});

// Méthodes statiques
roleSchema.statics.getDefaultRoles = function() {
  return [
    {
      name: 'admin',
      description: 'Administrateur complet avec tous les droits',
      level: 10,
      color: '#DC2626',
      icon: 'fas fa-crown',
      permissions: [
        { resource: 'admin', actions: ['create', 'read', 'update', 'delete', 'moderate', 'ban', 'unban', 'export', 'view_analytics'] },
        { resource: 'formations', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'ban', 'unban'] },
        { resource: 'reservations', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'comments', actions: ['create', 'read', 'update', 'delete', 'moderate'] },
        { resource: 'analytics', actions: ['read', 'export', 'view_analytics'] },
        { resource: 'settings', actions: ['read', 'update'] }
      ],
      isDefault: true
    },
    {
      name: 'instructor',
      description: 'Instructeur avec droits de gestion des formations',
      level: 7,
      color: '#059669',
      icon: 'fas fa-chalkboard-teacher',
      permissions: [
        { resource: 'formations', actions: ['create', 'read', 'update'] },
        { resource: 'reservations', actions: ['read'] },
        { resource: 'comments', actions: ['read', 'moderate'] },
        { resource: 'analytics', actions: ['read'] }
      ],
      isDefault: true
    },
    {
      name: 'moderator',
      description: 'Modérateur avec droits de modération',
      level: 5,
      color: '#7C3AED',
      icon: 'fas fa-shield-alt',
      permissions: [
        { resource: 'users', actions: ['read'] },
        { resource: 'comments', actions: ['read', 'update', 'delete', 'moderate'] },
        { resource: 'reservations', actions: ['read'] }
      ],
      isDefault: true
    },
    {
      name: 'user',
      description: 'Utilisateur standard avec accès de base',
      level: 1,
      color: '#6B7280',
      icon: 'fas fa-user',
      permissions: [
        { resource: 'formations', actions: ['read'] },
        { resource: 'reservations', actions: ['create', 'read', 'update'] },
        { resource: 'comments', actions: ['create', 'read'] }
      ],
      isDefault: true
    }
  ];
};

// Méthodes d'instance
roleSchema.methods.hasPermission = function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  
  return permission.actions.includes(action);
};

roleSchema.methods.canAccess = function(resource, action, context = {}) {
  // Vérifier la permission de base
  if (!this.hasPermission(resource, action)) return false;
  
  // Vérifier les conditions spécifiques
  const permission = this.permissions.find(p => p.resource === resource);
  if (permission.conditions) {
    // Logique de vérification des conditions
    for (const [key, value] of Object.entries(permission.conditions)) {
      if (context[key] !== value) return false;
    }
  }
  
  return true;
};

roleSchema.methods.addPermission = function(resource, actions, conditions = {}) {
  const existingPermission = this.permissions.find(p => p.resource === resource);
  
  if (existingPermission) {
    // Fusionner les actions
    const newActions = [...new Set([...existingPermission.actions, ...actions])];
    existingPermission.actions = newActions;
    existingPermission.conditions = { ...existingPermission.conditions, ...conditions };
  } else {
    this.permissions.push({ resource, actions, conditions });
  }
  
  return this.save();
};

roleSchema.methods.removePermission = function(resource, actions = null) {
  if (actions === null) {
    // Supprimer complètement la permission
    this.permissions = this.permissions.filter(p => p.resource !== resource);
  } else {
    // Supprimer seulement certaines actions
    const permission = this.permissions.find(p => p.resource === resource);
    if (permission) {
      permission.actions = permission.actions.filter(action => !actions.includes(action));
      if (permission.actions.length === 0) {
        this.permissions = this.permissions.filter(p => p.resource !== resource);
      }
    }
  }
  
  return this.save();
};

// Middleware pre-save pour validation
roleSchema.pre('save', function(next) {
  // Vérifier que le niveau est cohérent avec les permissions
  if (this.level < 5 && this.permissions.some(p => p.resource === 'admin')) {
    return next(new Error('Les rôles de niveau inférieur à 5 ne peuvent pas avoir de permissions admin'));
  }
  
  next();
});

module.exports = mongoose.model('Role', roleSchema);
