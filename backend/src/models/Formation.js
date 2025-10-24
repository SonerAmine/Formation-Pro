const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre de la formation est requis'],
    trim: true,
    maxLength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxLength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  descriptionComplete: {
    type: String,
    trim: true,
    maxLength: [2000, 'La description complète ne peut pas dépasser 2000 caractères']
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  duree: {
    type: Number,
    required: [true, 'La durée est requise'],
    min: [1, 'La durée doit être d\'au moins 1 heure']
  },
  placesTotales: {
    type: Number,
    required: [true, 'Le nombre de places totales est requis'],
    min: [1, 'Il doit y avoir au moins 1 place']
  },
  placesRestantes: {
    type: Number,
    required: [true, 'Le nombre de places restantes est requis'],
    min: [0, 'Le nombre de places restantes ne peut pas être négatif']
  },
  // Date limite supprimée - inscriptions toujours ouvertes
  dateDebut: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'La date de début doit être dans le futur'
    }
  },
  dateFin: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || !this.dateDebut || value > this.dateDebut;
      },
      message: 'La date de fin doit être après la date de début'
    }
  },
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: ['tech', 'business', 'design', 'marketing', 'management', 'autres'],
      message: 'Catégorie non valide'
    }
  },
  niveau: {
    type: String,
    enum: ['debutant', 'intermediaire', 'avance'],
    default: 'debutant'
  },
  prerequis: [{
    type: String,
    trim: true
  }],
  objectifs: [{
    type: String,
    trim: true
  }],
  programme: [{
    titre: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    duree: {
      type: Number,
      min: 0
    }
  }],
  formateur: {
    nom: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true
    },
    expertise: [{
      type: String,
      trim: true
    }]
  },
  materiel: [{
    type: String,
    trim: true
  }],
  certification: {
    disponible: {
      type: Boolean,
      default: false
    },
    nom: {
      type: String,
      trim: true
    },
    organisme: {
      type: String,
      trim: true
    }
  },
  mode: {
    type: String,
    enum: ['presentiel', 'distanciel', 'hybride'],
    default: 'presentiel'
  },
  lieu: {
    adresse: {
      type: String,
      trim: true
    },
    ville: {
      type: String,
      trim: true
    },
    codePostal: {
      type: String,
      trim: true
    },
    salle: {
      type: String,
      trim: true
    }
  },
  lienVisio: {
    type: String,
    trim: true
  },
  statut: {
    type: String,
    enum: ['brouillon', 'publiee', 'annulee', 'terminee'],
    default: 'brouillon'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  image: {
    type: String,
    trim: true
  },
  notesMoyenne: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  nombreAvis: {
    type: Number,
    default: 0,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
formationSchema.index({ titre: 'text', description: 'text' });
formationSchema.index({ categorie: 1 });
formationSchema.index({ statut: 1 });
formationSchema.index({ dateLimite: 1 });
formationSchema.index({ prix: 1 });
formationSchema.index({ createdAt: -1 });
formationSchema.index({ tags: 1 });

// Virtual pour les réservations
formationSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'formationId',
  justOne: false
});

// Virtual pour les commentaires
formationSchema.virtual('commentaires', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'formationId',
  justOne: false
});

// Virtual pour vérifier si la formation est complète
formationSchema.virtual('estComplete').get(function() {
  return this.placesRestantes === 0;
});

// Virtual pour vérifier si la formation est expirée (basé sur dateDebut)
formationSchema.virtual('estExpiree').get(function() {
  return this.dateDebut ? this.dateDebut < new Date() : false;
});

// Virtual pour vérifier si la réservation est possible
formationSchema.virtual('reservationPossible').get(function() {
  return !this.estComplete && !this.estExpiree && this.statut === 'publiee' && this.active;
});

// Virtual pour le taux de remplissage
formationSchema.virtual('tauxRemplissage').get(function() {
  return ((this.placesTotales - this.placesRestantes) / this.placesTotales) * 100;
});

// Middleware pre-save pour validation
formationSchema.pre('save', function(next) {
  // Vérifier que les places restantes ne dépassent pas les places totales
  if (this.placesRestantes > this.placesTotales) {
    this.placesRestantes = this.placesTotales;
  }
  
  // Si on modifie les places totales, ajuster les places restantes
  if (this.isModified('placesTotales')) {
    const placesReservees = this.placesTotales - this.placesRestantes;
    if (placesReservees > this.placesTotales) {
      return next(new Error('Le nombre de places totales ne peut pas être inférieur aux places déjà réservées'));
    }
  }
  
  next();
});

// Méthode pour réserver une place
formationSchema.methods.reserverPlace = function() {
  if (this.placesRestantes <= 0) {
    throw new Error('Aucune place disponible');
  }
  if (this.statut !== 'publiee') {
    throw new Error('Cette formation n\'est pas disponible à la réservation');
  }
  // Plus de vérification de date limite - inscriptions toujours ouvertes
  
  this.placesRestantes -= 1;
  return this.save();
};

// Méthode pour libérer une place
formationSchema.methods.libererPlace = function() {
  if (this.placesRestantes >= this.placesTotales) {
    throw new Error('Toutes les places sont déjà disponibles');
  }
  
  this.placesRestantes += 1;
  return this.save();
};

// Méthode pour calculer la note moyenne
formationSchema.methods.calculerNoteMoyenne = async function() {
  const Comment = this.model('Comment');
  const stats = await Comment.aggregate([
    { $match: { formationId: this._id } },
    {
      $group: {
        _id: null,
        moyenneNote: { $avg: '$note' },
        nombreAvis: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.notesMoyenne = Math.round(stats[0].moyenneNote * 10) / 10;
    this.nombreAvis = stats[0].nombreAvis;
  } else {
    this.notesMoyenne = 0;
    this.nombreAvis = 0;
  }
  
  return this.save();
};

// Méthode statique pour recherche
formationSchema.statics.rechercher = function(query, options = {}) {
  const {
    categorie,
    niveauMin,
    niveauMax,
    prixMin,
    prixMax,
    mode,
    disponibleUniquement = false,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const filter = {
    statut: 'publiee',
    active: true
  };
  
  // Recherche textuelle
  if (query) {
    filter.$text = { $search: query };
  }
  
  // Filtres
  if (categorie) filter.categorie = categorie;
  if (mode) filter.mode = mode;
  if (prixMin !== undefined || prixMax !== undefined) {
    filter.prix = {};
    if (prixMin !== undefined) filter.prix.$gte = prixMin;
    if (prixMax !== undefined) filter.prix.$lte = prixMax;
  }
  
  // Formations disponibles uniquement
  if (disponibleUniquement) {
    filter.placesRestantes = { $gt: 0 };
    // Plus de filtre sur dateLimite
  }
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('commentaires', 'note contenu userId createdAt');
};

// Méthode statique pour les statistiques
formationSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const publiees = await this.countDocuments({ statut: 'publiee' });
  const brouillons = await this.countDocuments({ statut: 'brouillon' });
  const terminees = await this.countDocuments({ statut: 'terminee' });
  const annulees = await this.countDocuments({ statut: 'annulee' });
  
  const statsParCategorie = await this.aggregate([
    { $match: { statut: 'publiee' } },
    { $group: { _id: '$categorie', count: { $sum: 1 } } }
  ]);
  
  return {
    total,
    publiees,
    brouillons,
    terminees,
    annulees,
    parCategorie: statsParCategorie
  };
};

module.exports = mongoose.model('Formation', formationSchema);
