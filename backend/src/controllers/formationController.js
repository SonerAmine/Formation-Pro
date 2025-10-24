const Formation = require('../models/Formation');
const Comment = require('../models/Comment');

// @desc    Récupérer toutes les formations
// @route   GET /api/formations
// @access  Public
const getFormations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      categorie,
      prixMin,
      prixMax,
      disponibleUniquement = false
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      categorie,
      prixMin: prixMin ? parseFloat(prixMin) : undefined,
      prixMax: prixMax ? parseFloat(prixMax) : undefined,
      disponibleUniquement: disponibleUniquement === 'true'
    };

    const formations = await Formation.rechercher('', options);

    // Si l'utilisateur est connecté, marquer ses favoris
    if (req.user) {
      formations.forEach(formation => {
        formation.isFavorite = req.user.isFavorite(formation._id);
      });
    }

    const total = await Formation.countDocuments({
      statut: 'publiee',
      active: true,
      ...(categorie && { categorie }),
      ...(prixMin !== undefined || prixMax !== undefined) && {
        prix: {
          ...(prixMin !== undefined && { $gte: prixMin }),
          ...(prixMax !== undefined && { $lte: prixMax })
        }
      },
      ...(disponibleUniquement && {
        placesRestantes: { $gt: 0 }
        // Plus de filtre sur dateLimite
      })
    });

    res.json({
      success: true,
      count: formations.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: formations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des formations'
    });
  }
};

// @desc    Récupérer une formation par ID
// @route   GET /api/formations/:id
// @access  Public
const getFormation = async (req, res) => {
  try {
    // Récupérer la formation
    const formation = await Formation.findById(req.params.id);
    
    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    // Récupérer les commentaires séparément pour éviter les problèmes de populate
    const commentaires = await Comment.find({ 
      formationId: req.params.id,
      statut: { $in: ['approuve', 'en_attente'] },
      masque: false
    })
    .populate('userId', 'nom prenom')
    .sort({ createdAt: -1 })
    .limit(20);

    // Ajouter les commentaires à la formation
    formation.commentaires = commentaires;

    // Vérifier si la formation est accessible (publiée et active)
    if (formation.statut !== 'publiee' || !formation.active) {
      // Seuls les admins peuvent voir les formations non publiées
      if (!req.user || req.user.role !== 'admin') {
        return res.status(404).json({
          success: false,
          error: 'Formation non trouvée'
        });
      }
    }

    // Si l'utilisateur est connecté, vérifier si c'est un favori
    if (req.user) {
      formation.isFavorite = req.user.isFavorite(formation._id);
    }

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de la formation'
    });
  }
};

// @desc    Créer une nouvelle formation
// @route   POST /api/formations
// @access  Private/Admin
const createFormation = async (req, res) => {
  try {
    const formationData = {
      ...req.body,
      placesRestantes: req.body.placesTotales // Au départ, toutes les places sont disponibles
    };

    const formation = await Formation.create(formationData);

    res.status(201).json({
      success: true,
      message: 'Formation créée avec succès',
      data: formation
    });

    console.log(`✅ Nouvelle formation créée: ${formation.titre} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la création de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de la formation'
    });
  }
};

// @desc    Mettre à jour une formation
// @route   PUT /api/formations/:id
// @access  Private/Admin
const updateFormation = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id);

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    // Calculer les nouvelles places restantes si placesTotales change
    if (req.body.placesTotales && req.body.placesTotales !== formation.placesTotales) {
      const placesReservees = formation.placesTotales - formation.placesRestantes;
      const nouvellesPlacesRestantes = req.body.placesTotales - placesReservees;
      
      if (nouvellesPlacesRestantes < 0) {
        return res.status(400).json({
          success: false,
          error: 'Le nombre de places totales ne peut pas être inférieur aux places déjà réservées'
        });
      }
      
      req.body.placesRestantes = nouvellesPlacesRestantes;
    }

    const updatedFormation = await Formation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Formation mise à jour avec succès',
      data: updatedFormation
    });

    console.log(`✅ Formation mise à jour: ${updatedFormation.titre} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour de la formation'
    });
  }
};

// @desc    Supprimer une formation
// @route   DELETE /api/formations/:id
// @access  Private/Admin
const deleteFormation = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id);

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    // Vérifier s'il y a des réservations actives
    const Reservation = require('../models/Reservation');
    const reservationsActives = await Reservation.countDocuments({
      formationId: req.params.id,
      statut: 'active'
    });

    if (reservationsActives > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer une formation avec des réservations actives'
      });
    }

    await formation.remove();

    res.json({
      success: true,
      message: 'Formation supprimée avec succès'
    });

    console.log(`✅ Formation supprimée: ${formation.titre} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la suppression de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de la formation'
    });
  }
};

// @desc    Rechercher des formations
// @route   GET /api/formations/search
// @access  Public
const searchFormations = async (req, res) => {
  try {
    const {
      q = '',
      page = 1,
      limit = 10,
      categorie,
      prixMin,
      prixMax,
      disponibleUniquement = false
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      categorie,
      prixMin: prixMin ? parseFloat(prixMin) : undefined,
      prixMax: prixMax ? parseFloat(prixMax) : undefined,
      disponibleUniquement: disponibleUniquement === 'true'
    };

    const formations = await Formation.rechercher(q, options);

    // Si l'utilisateur est connecté, marquer ses favoris
    if (req.user) {
      formations.forEach(formation => {
        formation.isFavorite = req.user.isFavorite(formation._id);
      });
    }

    res.json({
      success: true,
      count: formations.length,
      query: q,
      data: formations
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la recherche'
    });
  }
};

// @desc    Récupérer les formations par catégorie
// @route   GET /api/formations/category/:category
// @access  Public
const getFormationsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const formations = await Formation.find({
      categorie: category,
      statut: 'publiee',
      active: true
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Formation.countDocuments({
      categorie: category,
      statut: 'publiee',
      active: true
    });

    // Si l'utilisateur est connecté, marquer ses favoris
    if (req.user) {
      formations.forEach(formation => {
        formation.isFavorite = req.user.isFavorite(formation._id);
      });
    }

    res.json({
      success: true,
      count: formations.length,
      total,
      category,
      data: formations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération par catégorie:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération par catégorie'
    });
  }
};

// @desc    Récupérer les statistiques des formations
// @route   GET /api/formations/stats
// @access  Public
const getFormationStats = async (req, res) => {
  try {
    const stats = await Formation.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};

module.exports = {
  getFormations,
  getFormation,
  createFormation,
  updateFormation,
  deleteFormation,
  searchFormations,
  getFormationsByCategory,
  getFormationStats
};
