const User = require('../models/User');
const Formation = require('../models/Formation');

// @desc    Ajouter une formation aux favoris
// @route   POST /api/users/favorites/:formationId
// @access  Private
const addToFavorites = async (req, res) => {
  try {
    const { formationId } = req.params;

    // Vérifier si la formation existe
    const formation = await Formation.findById(formationId);
    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    const user = await User.findById(req.user.id);

    // Vérifier si la formation est déjà dans les favoris
    if (user.isFavorite(formationId)) {
      return res.status(400).json({
        success: false,
        error: 'Cette formation est déjà dans vos favoris'
      });
    }

    // Ajouter aux favoris
    user.addToFavorites(formationId);
    await user.save();

    res.json({
      success: true,
      message: 'Formation ajoutée aux favoris',
      favoris: user.favoris
    });

    console.log(`✅ Formation ${formationId} ajoutée aux favoris de ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'ajout aux favoris'
    });
  }
};

// @desc    Retirer une formation des favoris
// @route   DELETE /api/users/favorites/:formationId
// @access  Private
const removeFromFavorites = async (req, res) => {
  try {
    const { formationId } = req.params;

    const user = await User.findById(req.user.id);

    // Vérifier si la formation est dans les favoris
    if (!user.isFavorite(formationId)) {
      return res.status(400).json({
        success: false,
        error: 'Cette formation n\'est pas dans vos favoris'
      });
    }

    // Retirer des favoris
    user.removeFromFavorites(formationId);
    await user.save();

    res.json({
      success: true,
      message: 'Formation retirée des favoris',
      favoris: user.favoris
    });

    console.log(`✅ Formation ${formationId} retirée des favoris de ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de la suppression des favoris:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression des favoris'
    });
  }
};

// @desc    Récupérer les formations favorites
// @route   GET /api/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favoris',
      match: { active: true }, // Seulement les formations actives
      select: 'titre description prix duree placesRestantes dateLimite categorie'
    });

    res.json({
      success: true,
      count: user.favoris.length,
      data: user.favoris
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des favoris'
    });
  }
};

// @desc    Récupérer les statistiques de l'utilisateur
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Compter les réservations par statut
    const Reservation = require('../models/Reservation');
    const reservationStats = await Reservation.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    // Compter les commentaires
    const Comment = require('../models/Comment');
    const commentCount = await Comment.countDocuments({ userId });

    // Compter les favoris
    const user = await User.findById(userId);
    const favoritesCount = user.favoris.length;

    res.json({
      success: true,
      stats: {
        reservations: reservationStats,
        commentaires: commentCount,
        favoris: favoritesCount,
        offresSpeciales: user.offresSpeciales
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

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getUserStats
};
