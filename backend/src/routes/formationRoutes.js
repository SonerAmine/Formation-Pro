const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  getFormations,
  getFormation,
  createFormation,
  updateFormation,
  deleteFormation,
  searchFormations,
  getFormationsByCategory,
  getFormationStats
} = require('../controllers/formationController');

// Import des middlewares
const { protect, adminOnly, optionalAuth } = require('../middlewares/authMiddleware');
const {
  validateFormation,
  validateObjectId,
  validateSearch
} = require('../middlewares/validationMiddleware');

// Routes publiques
router.get('/', validateSearch, optionalAuth, getFormations);
router.get('/search', validateSearch, optionalAuth, searchFormations);
router.get('/category/:category', optionalAuth, getFormationsByCategory);
router.get('/stats', getFormationStats);
router.get('/:id', validateObjectId, optionalAuth, getFormation);

// Routes protégées (admin uniquement)
router.use(protect, adminOnly);

router.post('/', validateFormation, createFormation);
router.put('/:id', validateObjectId, validateFormation, updateFormation);
router.delete('/:id', validateObjectId, deleteFormation);

module.exports = router;
