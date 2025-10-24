const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour protéger les routes
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Récupérer le token du header
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // Récupérer l'utilisateur sans le mot de passe
      req.user = await User.findById(decoded.id).select('-motDePasse');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      // Vérifier si l'utilisateur est banni
      if (req.user.isBanned()) {
        return res.status(403).json({
          success: false,
          error: 'Votre compte a été suspendu',
          details: req.user.banReason
        });
      }

      next();
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      return res.status(401).json({
        success: false,
        error: 'Token non valide'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Accès refusé, aucun token fourni'
    });
  }
};

// Middleware pour vérifier le rôle admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Accès refusé. Privilèges administrateur requis.'
    });
  }
};

// Middleware pour vérifier si l'utilisateur est propriétaire de la ressource ou admin
const ownerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user._id.toString() === req.params.userId)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres données.'
    });
  }
};

// Middleware optionnel pour les routes publiques avec authentification optionnelle
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = await User.findById(decoded.id).select('-motDePasse');
      
      // Si l'utilisateur est banni, on continue sans user (comme s'il n'était pas connecté)
      if (req.user && req.user.isBanned()) {
        req.user = null;
      }
    } catch (error) {
      // En cas d'erreur, on continue sans user (pas d'erreur)
      req.user = null;
    }
  }

  next();
};

// Middleware pour vérifier que l'utilisateur a le droit de commenter
const canComment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Vous devez être connecté pour commenter'
      });
    }

    // Vérifier si l'utilisateur a réservé cette formation
    const Reservation = require('../models/Reservation');
    const reservation = await Reservation.findOne({
      userId: req.user._id,
      formationId: req.body.formationId || req.params.formationId,
      statut: { $in: ['active', 'terminee'] }
    });

    if (!reservation) {
      return res.status(403).json({
        success: false,
        error: 'Vous devez avoir réservé cette formation pour pouvoir commenter'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification des droits de commentaire'
    });
  }
};

// Middleware pour limiter les tentatives de connexion
const loginLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + req.body.email;
    const now = Date.now();
    
    if (attempts.has(key)) {
      const userAttempts = attempts.get(key);
      const recentAttempts = userAttempts.filter(time => now - time < windowMs);
      
      if (recentAttempts.length >= maxAttempts) {
        return res.status(429).json({
          success: false,
          error: `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(windowMs / 60000)} minutes.`
        });
      }
      
      attempts.set(key, recentAttempts);
    }

    // Middleware pour enregistrer une tentative échouée
    req.recordFailedAttempt = () => {
      const userAttempts = attempts.get(key) || [];
      userAttempts.push(now);
      attempts.set(key, userAttempts);
    };

    // Middleware pour réinitialiser les tentatives en cas de succès
    req.clearFailedAttempts = () => {
      attempts.delete(key);
    };

    next();
  };
};

// Middleware pour vérifier les permissions sur les réservations
const canAccessReservation = async (req, res, next) => {
  try {
    const Reservation = require('../models/Reservation');
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Réservation non trouvée'
      });
    }

    // Admin peut tout voir, utilisateur ne peut voir que ses réservations
    if (req.user.role === 'admin' || reservation.userId.toString() === req.user._id.toString()) {
      req.reservation = reservation;
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Accès refusé à cette réservation'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification des permissions'
    });
  }
};

// Middleware pour vérifier les permissions sur les commentaires
const canAccessComment = async (req, res, next) => {
  try {
    const Comment = require('../models/Comment');
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    // Admin peut tout voir, utilisateur ne peut voir/modifier que ses commentaires
    if (req.user.role === 'admin' || comment.userId.toString() === req.user._id.toString()) {
      req.comment = comment;
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Accès refusé à ce commentaire'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification des permissions'
    });
  }
};

module.exports = {
  protect,
  adminOnly,
  ownerOrAdmin,
  optionalAuth,
  canComment,
  loginLimiter,
  canAccessReservation,
  canAccessComment
};
