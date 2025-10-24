const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  formationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
    required: [true, 'La formation est requise']
  },
  contenu: {
    type: String,
    required: [true, 'Le contenu du commentaire est requis'],
    trim: true,
    minLength: [10, 'Le commentaire doit contenir au moins 10 caractères'],
    maxLength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  },
  note: {
    type: Number,
    min: [1, 'La note doit être au minimum de 1'],
    max: [5, 'La note doit être au maximum de 5'],
    default: null
  },
  statut: {
    type: String,
    enum: {
      values: ['en_attente', 'approuve', 'rejete', 'signale'],
      message: 'Statut non valide'
    },
    default: 'en_attente'
  },
  dateApprobation: {
    type: Date,
    default: null
  },
  approuvePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  signalements: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    raison: {
      type: String,
      enum: ['spam', 'inapproprie', 'faux', 'autre'],
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxLength: [200, 'La description ne peut pas dépasser 200 caractères']
    },
    dateSignalement: {
      type: Date,
      default: Date.now
    }
  }],
  reponses: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contenu: {
      type: String,
      required: true,
      trim: true,
      minLength: [5, 'La réponse doit contenir au moins 5 caractères'],
      maxLength: [500, 'La réponse ne peut pas dépasser 500 caractères']
    },
    dateReponse: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dateLike: {
      type: Date,
      default: Date.now
    }
  }],
  masque: {
    type: Boolean,
    default: false
  },
  dateModification: {
    type: Date,
    default: null
  },
  historique: [{
    contenu: {
      type: String,
      required: true
    },
    note: {
      type: Number,
      min: 1,
      max: 5
    },
    dateModification: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
commentSchema.index({ formationId: 1, statut: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ note: 1 });
commentSchema.index({ statut: 1 });

// Index composé pour éviter les doublons de commentaires par utilisateur/formation
commentSchema.index({ userId: 1, formationId: 1 }, { unique: true });

// Virtual pour le nombre de likes
commentSchema.virtual('nombreLikes').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual pour le nombre de réponses
commentSchema.virtual('nombreReponses').get(function() {
  return this.reponses ? this.reponses.length : 0;
});

// Virtual pour le nombre de signalements
commentSchema.virtual('nombreSignalements').get(function() {
  return this.signalements ? this.signalements.length : 0;
});

// Virtual pour vérifier si le commentaire peut être modifié
commentSchema.virtual('peutEtreModifie').get(function() {
  const DELAI_MODIFICATION = 24 * 60 * 60 * 1000; // 24 heures
  return (new Date() - this.createdAt) < DELAI_MODIFICATION;
});

// Middleware pre-save pour validation
commentSchema.pre('save', async function(next) {
  try {
    // Vérifier que l'utilisateur a bien réservé cette formation
    if (this.isNew) {
      const Reservation = this.model('Reservation');
      const reservation = await Reservation.findOne({
        userId: this.userId,
        formationId: this.formationId,
        statut: { $in: ['terminee', 'active'] }
      });
      
      if (!reservation) {
        return next(new Error('Vous devez avoir réservé cette formation pour pouvoir commenter'));
      }
    }
    
    // Si le contenu est modifié, sauvegarder l'historique
    if (this.isModified('contenu') && !this.isNew) {
      this.historique.push({
        contenu: this.contenu,
        note: this.note,
        dateModification: new Date()
      });
      this.dateModification = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware post-save pour mettre à jour la note moyenne de la formation
commentSchema.post('save', async function(doc) {
  if (doc.note && (doc.statut === 'approuve' || doc.statut === 'en_attente')) {
    const Formation = this.model('Formation');
    const formation = await Formation.findById(doc.formationId);
    if (formation) {
      await formation.calculerNoteMoyenne();
    }
  }
});

// Middleware post-remove pour mettre à jour la note moyenne
commentSchema.post('remove', async function(doc) {
  const Formation = this.model('Formation');
  const formation = await Formation.findById(doc.formationId);
  if (formation) {
    await formation.calculerNoteMoyenne();
  }
});

// Méthode pour ajouter un like
commentSchema.methods.ajouterLike = function(userId) {
  // Vérifier si l'utilisateur a déjà liké
  const dejaLike = this.likes.some(like => like.userId.equals(userId));
  
  if (dejaLike) {
    // Retirer le like
    this.likes = this.likes.filter(like => !like.userId.equals(userId));
  } else {
    // Ajouter le like
    this.likes.push({ userId });
  }
  
  return this.save();
};

// Méthode pour ajouter une réponse
commentSchema.methods.ajouterReponse = function(userId, contenu) {
  this.reponses.push({
    userId,
    contenu,
    dateReponse: new Date()
  });
  
  return this.save();
};

// Méthode pour signaler le commentaire
commentSchema.methods.signaler = function(userId, raison, description = '') {
  // Vérifier si l'utilisateur a déjà signalé ce commentaire
  const dejSignale = this.signalements.some(signal => signal.userId.equals(userId));
  
  if (dejSignale) {
    throw new Error('Vous avez déjà signalé ce commentaire');
  }
  
  this.signalements.push({
    userId,
    raison,
    description,
    dateSignalement: new Date()
  });
  
  // Si le commentaire a été signalé plusieurs fois, le marquer comme signalé
  if (this.signalements.length >= 3) {
    this.statut = 'signale';
  }
  
  return this.save();
};

// Méthode pour approuver le commentaire
commentSchema.methods.approuver = function(approuvePar) {
  this.statut = 'approuve';
  this.dateApprobation = new Date();
  this.approuvePar = approuvePar;
  
  return this.save();
};

// Méthode pour rejeter le commentaire
commentSchema.methods.rejeter = function() {
  this.statut = 'rejete';
  this.masque = true;
  
  return this.save();
};

// Méthode pour masquer/démasquer le commentaire
commentSchema.methods.basculerMasquage = function() {
  this.masque = !this.masque;
  return this.save();
};

// Méthode statique pour obtenir les commentaires d'une formation
commentSchema.statics.getByFormation = function(formationId, options = {}) {
  const { 
    statut = ['approuve', 'en_attente'], 
    page = 1, 
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const filter = {
    formationId,
    statut: { $in: Array.isArray(statut) ? statut : [statut] },
    masque: false
  };
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(filter)
    .populate('userId', 'nom prenom')
    .populate('reponses.userId', 'nom prenom')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

// Méthode statique pour obtenir les commentaires d'un utilisateur
commentSchema.statics.getByUser = function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return this.find({ userId })
    .populate('formationId', 'titre')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Méthode statique pour les statistiques
commentSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const approuves = await this.countDocuments({ statut: 'approuve' });
  const enAttente = await this.countDocuments({ statut: 'en_attente' });
  const rejetes = await this.countDocuments({ statut: 'rejete' });
  const signales = await this.countDocuments({ statut: 'signale' });
  
  const notesMoyennes = await this.aggregate([
    { $match: { note: { $exists: true }, statut: 'approuve' } },
    {
      $group: {
        _id: null,
        moyenneGenerale: { $avg: '$note' },
        nombreAvis: { $sum: 1 }
      }
    }
  ]);
  
  return {
    total,
    approuves,
    enAttente,
    rejetes,
    signales,
    notesMoyennes: notesMoyennes[0] || { moyenneGenerale: 0, nombreAvis: 0 }
  };
};

// Méthode statique pour obtenir les commentaires à modérer
commentSchema.statics.getAModerer = function(options = {}) {
  const { page = 1, limit = 20 } = options;
  
  return this.find({ 
    $or: [
      { statut: 'en_attente' },
      { statut: 'signale' }
    ]
  })
    .populate('userId', 'nom prenom email')
    .populate('formationId', 'titre')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('Comment', commentSchema);
