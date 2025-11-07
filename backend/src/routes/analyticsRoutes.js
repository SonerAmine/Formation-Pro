const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  getOverviewStats,
  getEngagementMetrics,
  getUserEngagementDetails,
  updateAllEngagementMetrics,
  getActivityTrends
} = require('../controllers/analyticsController');

// Import des middlewares
const { protect } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/activityMiddleware');

// Toutes les routes nécessitent une authentification et des permissions admin
router.use(protect);
router.use(checkPermission('analytics', 'read'));

// Routes pour les statistiques
router.get('/overview', getOverviewStats);
router.get('/engagement', getEngagementMetrics);
router.get('/user/:userId', getUserEngagementDetails);
router.get('/trends', getActivityTrends);

// Route pour mettre à jour les métriques
router.post('/update-metrics', checkPermission('analytics', 'view_analytics'), updateAllEngagementMetrics);

module.exports = router;
