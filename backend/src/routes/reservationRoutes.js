const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  createReservation,
  getMyReservations,
  getReservation,
  cancelReservation,
  getAllReservations,
  updateReservationStatus
} = require('../controllers/reservationController');

// Import des middlewares
const { protect, adminOnly, canAccessReservation } = require('../middlewares/authMiddleware');
const {
  validateReservation,
  validateObjectId
} = require('../middlewares/validationMiddleware');

// Routes protégées (nécessitent une authentification)
router.use(protect);

// Routes utilisateur
router.post('/', validateReservation, createReservation);
router.get('/my', getMyReservations);
router.get('/:id', validateObjectId, canAccessReservation, getReservation);
router.put('/:id/cancel', validateObjectId, canAccessReservation, cancelReservation);

// Routes admin
router.get('/', adminOnly, getAllReservations);
router.put('/:id/status', adminOnly, validateObjectId, updateReservationStatus);

module.exports = router;
