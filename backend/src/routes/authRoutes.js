const express = require('express');
const router = express.Router();

// Import des contrôleurs
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  deleteAccount
} = require('../controllers/authController');

// Import du contrôleur Google OAuth
const {
  googleAuth,
  verifyGoogleToken,
  linkGoogleAccount
} = require('../controllers/googleAuthController');

// Import des middlewares
const { protect } = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateChangePassword
} = require('../middlewares/validationMiddleware');
const { uploadAvatar, handleUploadError } = require('../middlewares/uploadMiddleware');

// Routes publiques d'authentification
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/refresh-token', refreshToken);

// Routes Google OAuth
router.post('/google', googleAuth);
router.post('/google/verify', verifyGoogleToken);

// Routes protégées (nécessitent une authentification)
router.use(protect); // Applique la protection à toutes les routes suivantes

router.get('/me', getProfile);
router.put('/profile', uploadAvatar, handleUploadError, validateUpdateProfile, updateProfile);
router.put('/update-profile', uploadAvatar, handleUploadError, validateUpdateProfile, updateProfile);
router.put('/change-password', validateChangePassword, changePassword);
router.delete('/account', deleteAccount);
router.post('/google/link', linkGoogleAccount);

module.exports = router;
