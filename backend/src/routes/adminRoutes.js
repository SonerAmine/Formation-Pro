const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
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
} = require('../controllers/adminController');

// Import des middlewares
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const {
  validateObjectId,
  validateUserId,
  validateBan,
  validateSpecialOffer,
  validateSearch
} = require('../middlewares/validationMiddleware');

// Toutes les routes nécessitent une authentification admin
router.use(protect, adminOnly);

// Statistiques générales
router.get('/stats', getStats);

// Gestion des utilisateurs
router.get('/users', validateSearch, getUsers);
router.get('/users/:userId', validateUserId, getUserById);
router.put('/users/:userId', validateUserId, updateUser);
router.put('/users/:userId/ban', validateUserId, validateBan, banUser);
router.put('/users/:userId/unban', validateUserId, unbanUser);
router.put('/users/:userId/special-offer', validateUserId, validateSpecialOffer, giveSpecialOffer);

// Gestion des formations (vue admin)
router.get('/formations', validateSearch, getFormations);

// Gestion des réservations (vue admin)
router.get('/reservations', validateSearch, getReservations);

// Modération des commentaires
router.put('/comments/:id/moderate', validateObjectId, moderateComment);
router.delete('/comments/:id', validateObjectId, deleteComment);

module.exports = router;
