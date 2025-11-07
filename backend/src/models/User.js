const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxLength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    maxLength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  telephone: {
    type: String,
    required: function() {
      // Téléphone requis uniquement si ce n'est pas une connexion Google
      return this.authProvider === 'local';
    },
    trim: true,
    match: [/^[0-9+\-\s]{10,}$/, 'Veuillez fournir un numéro de téléphone valide']
  },
  genre: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  motDePasse: {
    type: String,
    required: function() {
      // Mot de passe requis uniquement si ce n'est pas une connexion Google
      return this.authProvider === 'local';
    },
    minLength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure le mot de passe dans les requêtes par défaut
  },
  // Champs pour l'authentification Google OAuth
  googleId: {
    type: String,
    default: null,
    sparse: true,
    unique: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    default: null
  },
  favoris: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation'
  }],
  offresSpeciales: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre d\'offres spéciales ne peut pas être négatif']
  },
  banned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  bannedAt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  // Métriques d'engagement
  engagementMetrics: {
    eScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastActivity: {
      type: Date,
      default: null
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0 // en minutes
    },
    avgSessionDuration: {
      type: Number,
      default: 0
    },
    frequency: {
      type: Number,
      default: 0 // jours actifs / jours total
    },
    influence: {
      type: Number,
      default: 0
    },
    evaluation: {
      type: Number,
      default: 0
    },
    lastCalculated: {
      type: Date,
      default: null
    }
  },
  // Préférences de notification
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    formations: {
      type: Boolean,
      default: true
    },
    reservations: {
      type: Boolean,
      default: true
    },
    comments: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ roleId: 1 });
userSchema.index({ 'engagementMetrics.eScore': -1 });
userSchema.index({ 'engagementMetrics.lastActivity': -1 });
userSchema.index({ banned: 1 });

// Virtual pour le nom complet
userSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

// Virtual pour le rôle détaillé
userSchema.virtual('roleDetails', {
  ref: 'Role',
  localField: 'roleId',
  foreignField: '_id',
  justOne: true
});

// Méthodes pour l'engagement
userSchema.methods.updateEngagementMetrics = async function() {
  const UserActivity = require('./UserActivity');
  const eScoreData = await UserActivity.getEScore(this._id, 30);
  
  this.engagementMetrics = {
    ...this.engagementMetrics,
    ...eScoreData.breakdown,
    eScore: eScoreData.eScore,
    lastCalculated: new Date()
  };
  
  return this.save();
};

userSchema.methods.recordActivity = async function(activityType, metadata = {}) {
  const UserActivity = require('./UserActivity');
  
  // Créer une nouvelle activité
  const activity = new UserActivity({
    userId: this._id,
    sessionId: metadata.sessionId || 'unknown',
    interactions: [{
      type: activityType,
      metadata
    }],
    deviceInfo: metadata.deviceInfo || {},
    location: metadata.location || {}
  });
  
  await activity.save();
  
  // Mettre à jour la dernière activité
  this.engagementMetrics.lastActivity = new Date();
  await this.save();
  
  return activity;
};

userSchema.methods.hasPermission = async function(resource, action, context = {}) {
  // Si l'utilisateur est admin, il a tous les droits
  if (this.role === 'admin') return true;
  
  // Vérifier les permissions du rôle
  if (this.roleId) {
    await this.populate('roleDetails');
    if (this.roleDetails) {
      return this.roleDetails.canAccess(resource, action, context);
    }
  }
  
  // Permissions par défaut basées sur le rôle simple
  const defaultPermissions = {
    user: {
      formations: ['read'],
      reservations: ['create', 'read', 'update'],
      comments: ['create', 'read']
    },
    admin: {
      admin: ['create', 'read', 'update', 'delete', 'moderate', 'ban', 'unban', 'export', 'view_analytics'],
      formations: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete', 'ban', 'unban'],
      reservations: ['create', 'read', 'update', 'delete'],
      comments: ['create', 'read', 'update', 'delete', 'moderate'],
      analytics: ['read', 'export', 'view_analytics'],
      settings: ['read', 'update']
    }
  };
  
  const rolePermissions = defaultPermissions[this.role] || {};
  return rolePermissions[resource]?.includes(action) || false;
};

// Virtual pour compter les réservations
userSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'userId',
  justOne: false
});

// Middleware pre-save pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  // Ne pas hasher si le mot de passe n'a pas été modifié
  if (!this.isModified('motDePasse')) return next();

  try {
    // Hasher le mot de passe avec un coût de 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.motDePasse = await bcrypt.hash(this.motDePasse, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.motDePasse);
};

// Méthode pour générer un token de réinitialisation de mot de passe
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Méthode pour vérifier si l'utilisateur est banni
userSchema.methods.isBanned = function() {
  return this.banned === true;
};

// Méthode pour bannir un utilisateur
userSchema.methods.banUser = function(reason) {
  this.banned = true;
  this.banReason = reason;
  this.bannedAt = new Date();
};

// Méthode pour débannir un utilisateur
userSchema.methods.unbanUser = function() {
  this.banned = false;
  this.banReason = null;
  this.bannedAt = null;
};

// Méthode pour ajouter une formation aux favoris
userSchema.methods.addToFavorites = function(formationId) {
  if (!this.favoris.includes(formationId)) {
    this.favoris.push(formationId);
  }
};

// Méthode pour retirer une formation des favoris
userSchema.methods.removeFromFavorites = function(formationId) {
  this.favoris = this.favoris.filter(id => !id.equals(formationId));
};

// Méthode pour vérifier si une formation est dans les favoris
userSchema.methods.isFavorite = function(formationId) {
  return this.favoris.some(id => id.equals(formationId));
};

// Middleware pre-remove pour nettoyer les références
userSchema.pre('remove', async function(next) {
  try {
    // Supprimer toutes les réservations de cet utilisateur
    await this.model('Reservation').deleteMany({ userId: this._id });
    
    // Supprimer tous les commentaires de cet utilisateur
    await this.model('Comment').deleteMany({ userId: this._id });
    
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode statique pour trouver par email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Méthode statique pour les statistiques
userSchema.statics.getStats = async function() {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ banned: false });
  const bannedUsers = await this.countDocuments({ banned: true });
  const adminUsers = await this.countDocuments({ role: 'admin' });
  
  return {
    total: totalUsers,
    active: activeUsers,
    banned: bannedUsers,
    admins: adminUsers
  };
};

module.exports = mongoose.model('User', userSchema);
