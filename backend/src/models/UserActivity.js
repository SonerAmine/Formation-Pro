const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  sessionId: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // en minutes
    default: 0
  },
  pageViews: [{
    page: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // temps passé sur la page en secondes
      default: 0
    }
  }],
  formationsViewed: [{
    formationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Formation'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // temps passé à voir la formation en secondes
      default: 0
    }
  }],
  interactions: [{
    type: {
      type: String,
      enum: ['login', 'logout', 'view_formation', 'reserve_formation', 'cancel_reservation', 'add_favorite', 'remove_favorite', 'comment', 'like_comment', 'share']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  deviceInfo: {
    userAgent: String,
    ip: String,
    platform: String,
    browser: String
  },
  location: {
    country: String,
    city: String,
    timezone: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
userActivitySchema.index({ userId: 1, loginTime: -1 });
userActivitySchema.index({ sessionId: 1 });
userActivitySchema.index({ 'interactions.type': 1, 'interactions.timestamp': -1 });

// Méthodes virtuelles pour calculer les métriques
userActivitySchema.virtual('totalDuration').get(function() {
  if (this.logoutTime) {
    return Math.round((this.logoutTime - this.loginTime) / (1000 * 60)); // en minutes
  }
  return this.duration;
});

userActivitySchema.virtual('totalPageViews').get(function() {
  return this.pageViews.length;
});

userActivitySchema.virtual('totalFormationsViewed').get(function() {
  return this.formationsViewed.length;
});

// Méthodes statiques pour l'analyse
userActivitySchema.statics.getUserEngagementMetrics = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const activities = await this.find({
    userId,
    loginTime: { $gte: startDate }
  }).sort({ loginTime: -1 });

  // Calcul des métriques
  const totalSessions = activities.length;
  const totalDuration = activities.reduce((sum, activity) => sum + activity.totalDuration, 0);
  const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  const totalPageViews = activities.reduce((sum, activity) => sum + activity.totalPageViews, 0);
  const totalFormationsViewed = activities.reduce((sum, activity) => sum + activity.totalFormationsViewed, 0);
  
  // Fréquence de connexion (jours actifs sur les derniers jours)
  const uniqueDays = new Set(activities.map(activity => 
    activity.loginTime.toISOString().split('T')[0]
  )).size;
  
  const frequency = days > 0 ? uniqueDays / days : 0;

  return {
    totalSessions,
    totalDuration,
    avgSessionDuration,
    totalPageViews,
    totalFormationsViewed,
    frequency,
    uniqueDays,
    period: days
  };
};

userActivitySchema.statics.getEScore = async function(userId, days = 30) {
  const metrics = await this.getUserEngagementMetrics(userId, days);
  
  // Calcul du E-Score basé sur 5 métriques (0-100)
  const recency = await this.getRecencyScore(userId);
  const frequency = Math.min(metrics.frequency * 100, 100); // Normaliser à 100
  const duration = Math.min((metrics.avgSessionDuration / 60) * 20, 100); // 5h = 100 points
  const influence = await this.getInfluenceScore(userId, days);
  const evaluation = await this.getEvaluationScore(userId, days);
  
  const eScore = Math.round((recency + frequency + duration + influence + evaluation) / 5);
  
  return {
    eScore,
    breakdown: {
      recency,
      frequency,
      duration,
      influence,
      evaluation
    },
    metrics
  };
};

userActivitySchema.statics.getRecencyScore = async function(userId) {
  const lastActivity = await this.findOne({ userId })
    .sort({ loginTime: -1 });
  
  if (!lastActivity) return 0;
  
  const daysSinceLastActivity = Math.floor(
    (Date.now() - lastActivity.loginTime.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Score décroissant : 100 si aujourd'hui, 0 si plus de 30 jours
  return Math.max(0, 100 - (daysSinceLastActivity * 3.33));
};

userActivitySchema.statics.getInfluenceScore = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const Comment = require('./Comment');
  const Reservation = require('./Reservation');
  
  // Compter les commentaires, réservations, et interactions sociales
  const [comments, reservations, shares] = await Promise.all([
    Comment.countDocuments({ userId, createdAt: { $gte: startDate } }),
    Reservation.countDocuments({ userId, dateReservation: { $gte: startDate } }),
    this.countDocuments({ 
      userId, 
      'interactions.type': 'share',
      'interactions.timestamp': { $gte: startDate }
    })
  ]);
  
  // Score basé sur l'activité sociale (max 100)
  const socialActivity = comments * 10 + reservations * 15 + shares * 20;
  return Math.min(socialActivity, 100);
};

userActivitySchema.statics.getEvaluationScore = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const Comment = require('./Comment');
  
  // Récupérer les commentaires de l'utilisateur avec leurs notes
  const comments = await Comment.find({ 
    userId, 
    createdAt: { $gte: startDate },
    note: { $exists: true, $ne: null }
  });
  
  if (comments.length === 0) return 50; // Score neutre si pas d'évaluations
  
  const avgRating = comments.reduce((sum, comment) => sum + comment.note, 0) / comments.length;
  
  // Convertir la note moyenne (1-5) en score (0-100)
  return Math.round((avgRating / 5) * 100);
};

module.exports = mongoose.model('UserActivity', userActivitySchema);
