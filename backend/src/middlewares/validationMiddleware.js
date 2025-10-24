const { body, param, query, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Erreurs de validation',
      details: errors.array()
    });
  }
  
  next();
};

// Validations pour l'authentification
const validateRegister = [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('L\'email ne peut pas dépasser 100 caractères'),
  
  body('telephone')
    .matches(/^[0-9+\-\s]{10,}$/)
    .withMessage('Veuillez fournir un numéro de téléphone valide'),
  
  body('motDePasse')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  
  body('motDePasse')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  
  handleValidationErrors
];

// Validations for password reset
const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  handleValidationErrors
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Le token de réinitialisation est requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  handleValidationErrors
];

// Validations pour les formations
const validateFormation = [
  body('titre')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Le titre doit contenir entre 5 et 100 caractères'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 500 })
    .withMessage('La description doit contenir entre 20 et 500 caractères'),
  
  body('prix')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  
  body('duree')
    .isInt({ min: 1 })
    .withMessage('La durée doit être un nombre entier positif'),
  
  body('placesTotales')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Le nombre de places doit être entre 1 et 1000'),
  
  body('categorie')
    .isIn(['tech', 'business', 'design', 'marketing', 'management', 'autres'])
    .withMessage('Catégorie non valide'),
  
  // Champs optionnels
  body('niveau')
    .optional()
    .isIn(['debutant', 'intermediaire', 'avance'])
    .withMessage('Niveau non valide'),
  
  body('mode')
    .optional()
    .isIn(['presentiel', 'distanciel', 'hybride'])
    .withMessage('Mode non valide'),
    
  body('dateDebut')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide'),
    
  body('dateFin')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide'),
    
  body('statut')
    .optional()
    .isIn(['brouillon', 'publiee', 'annulee', 'terminee'])
    .withMessage('Statut non valide'),
  
  handleValidationErrors
];

// Validations pour les réservations
const validateReservation = [
  body('formationId')
    .isMongoId()
    .withMessage('ID de formation invalide'),
  
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  
  body('telephone')
    .matches(/^[0-9+\-\s]{10,}$/)
    .withMessage('Veuillez fournir un numéro de téléphone valide'),
  
  handleValidationErrors
];

// Validations pour les commentaires
const validateComment = [
  body('formationId')
    .isMongoId()
    .withMessage('ID de formation invalide'),
  
  body('contenu')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Le commentaire doit contenir entre 10 et 1000 caractères'),
  
  body('note')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  
  handleValidationErrors
];

// Validations pour les paramètres d'URL
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID invalide'),
  
  handleValidationErrors
];

const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('ID utilisateur invalide'),
  
  handleValidationErrors
];

const validateFormationId = [
  param('formationId')
    .isMongoId()
    .withMessage('ID formation invalide'),
  
  handleValidationErrors
];

// Validations pour les requêtes de recherche et pagination
const validateSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'titre', 'prix', 'dateLimite'])
    .withMessage('Champ de tri non valide'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri non valide'),
  
  query('categorie')
    .optional()
    .isIn(['tech', 'business', 'design', 'marketing', 'management', 'autres'])
    .withMessage('Catégorie non valide'),
  
  handleValidationErrors
];

// Validations pour la mise à jour du profil utilisateur
const validateUpdateProfile = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('telephone')
    .optional()
    .matches(/^[0-9+\-\s]{10,}$/)
    .withMessage('Veuillez fournir un numéro de téléphone valide'),
  
  handleValidationErrors
];

// Validations pour le changement de mot de passe
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('La confirmation du mot de passe ne correspond pas');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validations pour les offres spéciales (admin)
const validateSpecialOffer = [
  body('offers')
    .isInt({ min: 0, max: 100 })
    .withMessage('Le nombre d\'offres doit être entre 0 et 100'),
  
  handleValidationErrors
];

// Validations pour le bannissement (admin)
const validateBan = [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La raison du bannissement doit contenir entre 5 et 200 caractères'),
  
  handleValidationErrors
];

// Validation pour les signalements
const validateReport = [
  body('raison')
    .isIn(['spam', 'inapproprie', 'faux', 'autre'])
    .withMessage('Raison de signalement non valide'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La description ne peut pas dépasser 200 caractères'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateFormation,
  validateReservation,
  validateComment,
  validateObjectId,
  validateUserId,
  validateFormationId,
  validateSearch,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateSpecialOffer,
  validateBan,
  validateReport,
  handleValidationErrors
};
