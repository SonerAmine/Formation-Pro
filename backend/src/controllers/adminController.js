const User = require('../models/User');
const Formation = require('../models/Formation');
const Reservation = require('../models/Reservation');
const Comment = require('../models/Comment');

// @desc    Récupérer les statistiques générales
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const userStats = await User.getStats();
    
    // Statistiques des formations
    const formationStats = await Formation.getStats();
    
    // Statistiques des réservations
    const reservationStats = await Reservation.getStats();
    
    // Statistiques des commentaires
    const commentStats = await Comment.getStats();
    
    // Revenus totaux (basé sur les réservations terminées)
    const revenueData = await Reservation.aggregate([
      {
        $match: {
          statut: 'terminee',
          montantPaye: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$montantPaye' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, totalTransactions: 0 };

    // Évolution des inscriptions par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top formations (par nombre de réservations)
    const topFormations = await Reservation.aggregate([
      {
        $match: {
          statut: { $in: ['active', 'terminee'] }
        }
      },
      {
        $group: {
          _id: '$formationId',
          reservations: { $sum: 1 },
          revenue: { $sum: '$montantPaye' }
        }
      },
      {
        $lookup: {
          from: 'formations',
          localField: '_id',
          foreignField: '_id',
          as: 'formation'
        }
      },
      {
        $unwind: '$formation'
      },
      {
        $project: {
          titre: '$formation.titre',
          reservations: 1,
          revenue: 1
        }
      },
      {
        $sort: { reservations: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: {
        users: userStats,
        formations: formationStats,
        reservations: reservationStats,
        comments: commentStats,
        revenue,
        userGrowth,
        topFormations
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};

// @desc    Récupérer tous les utilisateurs (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      role,
      banned
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (banned !== undefined) filter.banned = banned === 'true';

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('-motDePasse')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: users
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
};

// @desc    Récupérer toutes les formations (Admin)
// @route   GET /api/admin/formations
// @access  Private/Admin
const getFormations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      statut,
      categorie
    } = req.query;

    const filter = {};
    if (statut) filter.statut = statut;
    if (categorie) filter.categorie = categorie;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const formations = await Formation.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Formation.countDocuments(filter);

    res.json({
      success: true,
      count: formations.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: formations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formations (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des formations'
    });
  }
};

// @desc    Récupérer toutes les réservations (Admin)
// @route   GET /api/admin/reservations
// @access  Private/Admin
const getReservations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'dateReservation',
      sortOrder = 'desc',
      statut,
      formationId
    } = req.query;

    const filter = {};
    if (statut) filter.statut = statut;
    if (formationId) filter.formationId = formationId;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reservations = await Reservation.find(filter)
      .populate('userId', 'nom prenom email')
      .populate('formationId', 'titre prix categorie')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments(filter);

    res.json({
      success: true,
      count: reservations.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: reservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations (admin):', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des réservations'
    });
  }
};

// @desc    Bannir un utilisateur
// @route   PUT /api/admin/users/:userId/ban
// @access  Private/Admin
const banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de bannir un administrateur'
      });
    }

    if (user.banned) {
      return res.status(400).json({
        success: false,
        error: 'Cet utilisateur est déjà banni'
      });
    }

    user.banUser(reason);
    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur banni avec succès',
      data: {
        userId: user._id,
        banned: user.banned,
        banReason: user.banReason,
        bannedAt: user.bannedAt
      }
    });

    console.log(`✅ Utilisateur banni: ${user.email} par ${req.user.email} (raison: ${reason})`);
  } catch (error) {
    console.error('Erreur lors du bannissement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du bannissement'
    });
  }
};

// @desc    Débannir un utilisateur
// @route   PUT /api/admin/users/:userId/unban
// @access  Private/Admin
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    if (!user.banned) {
      return res.status(400).json({
        success: false,
        error: 'Cet utilisateur n\'est pas banni'
      });
    }

    user.unbanUser();
    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur débanni avec succès',
      data: {
        userId: user._id,
        banned: user.banned
      }
    });

    console.log(`✅ Utilisateur débanni: ${user.email} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors du débannissement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du débannissement'
    });
  }
};

// @desc    Accorder des offres spéciales à un utilisateur
// @route   PUT /api/admin/users/:userId/special-offer
// @access  Private/Admin
const giveSpecialOffer = async (req, res) => {
  try {
    const { offers } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    user.offresSpeciales = offers;
    await user.save();

    res.json({
      success: true,
      message: 'Offres spéciales mises à jour avec succès',
      data: {
        userId: user._id,
        offresSpeciales: user.offresSpeciales
      }
    });

    console.log(`✅ Offres spéciales accordées: ${offers} à ${user.email} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de l\'attribution des offres:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'attribution des offres'
    });
  }
};

// @desc    Modérer un commentaire
// @route   PUT /api/admin/comments/:id/moderate
// @access  Private/Admin
const moderateComment = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    if (action === 'approve') {
      await comment.approuver(req.user.id);
    } else if (action === 'reject') {
      await comment.rejeter();
    } else {
      return res.status(400).json({
        success: false,
        error: 'Action invalide. Utilisez "approve" ou "reject"'
      });
    }

    res.json({
      success: true,
      message: `Commentaire ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
      data: comment
    });

    console.log(`✅ Commentaire ${action}: ${comment._id} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la modération:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modération'
    });
  }
};

// @desc    Supprimer un commentaire (Admin)
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    await comment.remove();

    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });

    console.log(`✅ Commentaire supprimé: ${comment._id} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du commentaire'
    });
  }
};

// @desc    Récupérer un utilisateur par ID
// @route   GET /api/admin/users/:userId
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-motDePasse')
      .populate('favoris', 'titre prix')
      .populate('reservations');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'utilisateur'
    });
  }
};

// @desc    Mettre à jour un utilisateur (Admin)
// @route   PUT /api/admin/users/:userId
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { nom, prenom, telephone, role } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (role && ['user', 'admin'].includes(role)) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: user
    });

    console.log(`✅ Utilisateur mis à jour: ${user.email} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour de l\'utilisateur'
    });
  }
};

module.exports = {
  getStats,
  getUsers,
  getFormations,
  getReservations,
  banUser,
  unbanUser,
  giveSpecialOffer,
  moderateComment,
  deleteComment,
  getUserById,
  updateUser
};
