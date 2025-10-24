const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  getCommentsByFormation,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  reportComment,
  getMyComments
} = require('../controllers/commentController');

// Import des middlewares
const { protect, canComment, canAccessComment } = require('../middlewares/authMiddleware');
const {
  validateComment,
  validateObjectId,
  validateFormationId,
  validateReport
} = require('../middlewares/validationMiddleware');

// Routes publiques
router.get('/formation/:formationId', validateFormationId, getCommentsByFormation);

// Routes protégées
router.use(protect);

router.post('/', validateComment, canComment, createComment);
router.get('/my', getMyComments);
router.put('/:id', validateObjectId, canAccessComment, updateComment);
router.delete('/:id', validateObjectId, canAccessComment, deleteComment);
router.post('/:id/like', validateObjectId, likeComment);
router.post('/:id/report', validateObjectId, validateReport, reportComment);

module.exports = router;
