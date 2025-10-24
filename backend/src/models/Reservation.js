const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
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
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true,
    match: [/^[0-9+\-\s]{10,}$/, 'Veuillez fournir un numéro de téléphone valide']
  },
  dateReservation: {
    type: Date,
    default: Date.now,
    required: true
  },
  statut: {
    type: String,
    enum: {
      values: ['active', 'annulee', 'terminee', 'absent'],
      message: 'Statut non valide'
    },
    default: 'active'
  },
  dateAnnulation: {
    type: Date,
    default: null
  },
  raisonAnnulation: {
    type: String,
    trim: true,
    maxLength: [200, 'La raison d\'annulation ne peut pas dépasser 200 caractères']
  },
  annulePar: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: null
  },
  montantPaye: {
    type: Number,
    min: [0, 'Le montant payé ne peut pas être négatif'],
    default: 0
  },
  methodePaiement: {
    type: String,
    enum: ['carte', 'virement', 'cheque', 'especes', 'gratuit'],
    default: null
  },
  statutPaiement: {
    type: String,
    enum: ['en_attente', 'paye', 'rembourse', 'echec'],
    default: 'en_attente'
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
  },
  presence: {
    type: String,
    enum: ['non_definie', 'present', 'absent', 'partiel'],
    default: 'non_definie'
  },
  datePresence: {
    type: Date,
    default: null
  },
  evaluationFormation: {
    note: {
      type: Number,
      min: 1,
      max: 5
    },
    commentaire: {
      type: String,
      trim: true,
      maxLength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
    },
    dateEvaluation: {
      type: Date,
      default: null
    }
  },
  certificat: {
    genere: {
      type: Boolean,
      default: false
    },
    dateGeneration: {
      type: Date,
      default: null
    },
    lienTelechargement: {
      type: String,
      trim: true
    }
  },
  rappels: [{
    type: {
      type: String,
      enum: ['email', 'sms'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    envoye: {
      type: Boolean,
      default: false
    },
    dateEnvoi: {
      type: Date,
      default: null
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
reservationSchema.index({ userId: 1, formationId: 1 }, { unique: true }); // Une seule réservation par user par formation
reservationSchema.index({ userId: 1 });
reservationSchema.index({ formationId: 1 });
reservationSchema.index({ statut: 1 });
reservationSchema.index({ dateReservation: -1 });
reservationSchema.index({ email: 1 });

// Virtual pour le nom complet
reservationSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

// Virtual pour vérifier si l'annulation est possible
reservationSchema.virtual('annulationPossible').get(function() {
  if (this.statut !== 'active') return false;
  
  // Populate la formation pour vérifier la date limite
  if (this.formationId && this.formationId.dateLimite) {
    return new Date() < this.formationId.dateLimite;
  }
  
  return true; // Par défaut, on permet l'annulation si la formation n'est pas populée
});

// Virtual pour calculer le nombre de jours avant la formation
reservationSchema.virtual('joursAvantFormation').get(function() {
  if (this.formationId && this.formationId.dateDebut) {
    const maintenant = new Date();
    const dateDebut = new Date(this.formationId.dateDebut);
    const diffTime = dateDebut - maintenant;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Middleware pre-save pour validation
reservationSchema.pre('save', async function(next) {
  try {
    // Vérifier que la formation existe et est disponible
    if (this.isNew || this.isModified('formationId')) {
      const Formation = this.model('Formation');
      const formation = await Formation.findById(this.formationId);
      
      if (!formation) {
        return next(new Error('Formation non trouvée'));
      }
      
      if (formation.statut !== 'publiee') {
        return next(new Error('Cette formation n\'est pas disponible à la réservation'));
      }
      
      if (formation.placesRestantes <= 0) {
        return next(new Error('Aucune place disponible pour cette formation'));
      }
      
      if (formation.dateLimite < new Date()) {
        return next(new Error('La date limite d\'inscription est dépassée'));
      }
    }
    
    // Si on annule la réservation, définir la date d'annulation
    if (this.isModified('statut') && this.statut === 'annulee' && !this.dateAnnulation) {
      this.dateAnnulation = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware post-save pour mettre à jour les places de la formation
reservationSchema.post('save', async function(doc) {
  const Formation = this.model('Formation');
  
  if (doc.statut === 'active') {
    // Réserver une place
    await Formation.findByIdAndUpdate(
      doc.formationId,
      { $inc: { placesRestantes: -1 } }
    );
  }
});

// Middleware pre-remove pour libérer une place
reservationSchema.pre('remove', async function(next) {
  try {
    if (this.statut === 'active') {
      const Formation = this.model('Formation');
      await Formation.findByIdAndUpdate(
        this.formationId,
        { $inc: { placesRestantes: 1 } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour annuler la réservation
reservationSchema.methods.annuler = async function(raison, annulePar = 'user') {
  if (this.statut !== 'active') {
    throw new Error('Cette réservation ne peut pas être annulée');
  }
  
  // Vérifier si l'annulation est encore possible
  const Formation = this.model('Formation');
  const formation = await Formation.findById(this.formationId);
  
  if (formation && formation.dateLimite < new Date()) {
    throw new Error('La date limite d\'annulation est dépassée');
  }
  
  // Annuler la réservation
  this.statut = 'annulee';
  this.dateAnnulation = new Date();
  this.raisonAnnulation = raison;
  this.annulePar = annulePar;
  
  // Libérer une place dans la formation
  if (formation) {
    formation.placesRestantes += 1;
    await formation.save();
  }
  
  return this.save();
};

// Méthode pour marquer la présence
reservationSchema.methods.marquerPresence = function(statut) {
  if (!['present', 'absent', 'partiel'].includes(statut)) {
    throw new Error('Statut de présence invalide');
  }
  
  this.presence = statut;
  this.datePresence = new Date();
  
  // Si la formation est terminée et que l'utilisateur était présent, marquer comme terminé
  if (statut === 'present') {
    this.statut = 'terminee';
  }
  
  return this.save();
};

// Méthode pour évaluer la formation
reservationSchema.methods.evaluerFormation = function(note, commentaire) {
  if (this.statut !== 'terminee') {
    throw new Error('Vous ne pouvez évaluer que les formations terminées');
  }
  
  if (note < 1 || note > 5) {
    throw new Error('La note doit être entre 1 et 5');
  }
  
  this.evaluationFormation = {
    note,
    commentaire,
    dateEvaluation: new Date()
  };
  
  return this.save();
};

// Méthode statique pour les statistiques
reservationSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const actives = await this.countDocuments({ statut: 'active' });
  const annulees = await this.countDocuments({ statut: 'annulee' });
  const terminees = await this.countDocuments({ statut: 'terminee' });
  
  const statsParMois = await this.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$dateReservation' },
          month: { $month: '$dateReservation' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  return {
    total,
    actives,
    annulees,
    terminees,
    parMois: statsParMois
  };
};

// Méthode statique pour obtenir les réservations d'un utilisateur
reservationSchema.statics.getByUser = function(userId, options = {}) {
  const { statut, page = 1, limit = 10 } = options;
  
  const filter = { userId };
  if (statut) filter.statut = statut;
  
  return this.find(filter)
    .populate('formationId', 'titre description prix duree dateLimite dateDebut categorie')
    .sort({ dateReservation: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Méthode statique pour obtenir les réservations d'une formation
reservationSchema.statics.getByFormation = function(formationId, options = {}) {
  const { statut, page = 1, limit = 50 } = options;
  
  const filter = { formationId };
  if (statut) filter.statut = statut;
  
  return this.find(filter)
    .populate('userId', 'nom prenom email')
    .sort({ dateReservation: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('Reservation', reservationSchema);
