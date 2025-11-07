const Comment = require('../models/Comment');
const Formation = require('../models/Formation');

// @desc    Récupérer les commentaires d'une formation
// @route   GET /api/comments/formation/:formationId
// @access  Public
const getCommentsByFormation = async (req, res) => {
  try {
    const { formationId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Vérifier si la formation existe
    const formation = await Formation.findById(formationId);
    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    const options = {
      statut: ['approuve', 'en_attente'],
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const comments = await Comment.getByFormation(formationId, options);

    const total = await Comment.countDocuments({
      formationId,
      statut: { $in: ['approuve', 'en_attente'] },
      masque: false
    });

    res.json({
      success: true,
      count: comments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: comments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des commentaires'
    });
  }
};

// @desc    Créer un nouveau commentaire
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { formationId, contenu, note } = req.body;

    // Vérifier si la formation existe
    const formation = await Formation.findById(formationId);
    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    // Vérifier si l'utilisateur a déjà commenté cette formation
    const existingComment = await Comment.findOne({
      userId: req.user.id,
      formationId
    });

    if (existingComment) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà commenté cette formation'
      });
    }

    // Créer le commentaire
    const comment = await Comment.create({
      userId: req.user.id,
      formationId,
      contenu,
      note
    });

    await comment.populate('userId', 'nom prenom');

    res.status(201).json({
      success: true,
      message: 'Commentaire créé avec succès',
      data: comment
    });

    console.log(`✅ Nouveau commentaire sur ${formation.titre} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la création du commentaire:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de la création du commentaire'
    });
  }
};

// @desc    Mettre à jour un commentaire
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const { contenu, note } = req.body;
    const comment = req.comment;

    // Vérifier si le commentaire peut encore être modifié
    if (!comment.peutEtreModifie) {
      return res.status(400).json({
        success: false,
        error: 'Ce commentaire ne peut plus être modifié (délai dépassé)'
      });
    }

    // Mettre à jour le commentaire
    if (contenu) comment.contenu = contenu;
    if (note !== undefined) comment.note = note;

    await comment.save();
    await comment.populate('userId', 'nom prenom');

    res.json({
      success: true,
      message: 'Commentaire mis à jour avec succès',
      data: comment
    });

    console.log(`✅ Commentaire mis à jour: ${comment._id} par ${req.user.email}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du commentaire:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du commentaire'
    });
  }
};

// @desc    Supprimer un commentaire
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = req.comment;

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

// @desc    Liker/Unliker un commentaire
// @route   POST /api/comments/:id/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    // Vérifier si l'utilisateur peut liker (pas son propre commentaire)
    if (comment.userId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas liker votre propre commentaire'
      });
    }

    await comment.ajouterLike(req.user.id);

    res.json({
      success: true,
      message: 'Like mis à jour avec succès',
      likes: comment.nombreLikes
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du like:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du like'
    });
  }
};

// @desc    Signaler un commentaire
// @route   POST /api/comments/:id/report
// @access  Private
const reportComment = async (req, res) => {
  try {
    const { raison, description } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    // Vérifier si l'utilisateur peut signaler (pas son propre commentaire)
    if (comment.userId.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas signaler votre propre commentaire'
      });
    }

    await comment.signaler(req.user.id, raison, description);

    res.json({
      success: true,
      message: 'Commentaire signalé avec succès'
    });

    console.log(`✅ Commentaire signalé: ${comment._id} par ${req.user.email} (raison: ${raison})`);
  } catch (error) {
    console.error('Erreur lors du signalement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors du signalement'
    });
  }
};

// @desc    Récupérer les commentaires de l'utilisateur connecté
// @route   GET /api/comments/my
// @access  Private
const getMyComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const comments = await Comment.getByUser(req.user.id, options);

    const total = await Comment.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      count: comments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: comments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires utilisateur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des commentaires'
    });
  }
};

module.exports = {
  getCommentsByFormation,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  reportComment,
  getMyComments
};
