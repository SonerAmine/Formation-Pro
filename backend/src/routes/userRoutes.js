const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getUserStats
} = require('../controllers/userController');

// Import des middlewares
const { protect } = require('../middlewares/authMiddleware');
const { validateFormationId } = require('../middlewares/validationMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les favoris
router.get('/favorites', getFavorites);
router.post('/favorites/:formationId', validateFormationId, addToFavorites);
router.delete('/favorites/:formationId', validateFormationId, removeFromFavorites);

// Statistiques utilisateur
router.get('/stats', getUserStats);

module.exports = router;
