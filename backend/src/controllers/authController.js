const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Générer un refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, motDePasse } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      nom,
      prenom,
      email,
      telephone,
      motDePasse
    });

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      refreshToken,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        genre: user.genre,
        avatar: user.avatar,
        favoris: user.favoris,
        offresSpeciales: user.offresSpeciales
      }
    });

    console.log(`✅ Nouvel utilisateur inscrit: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'inscription'
    });
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Vérifier si l'utilisateur existe et récupérer le mot de passe
    const user = await User.findOne({ email }).select('+motDePasse');
    
    if (!user) {
      // Enregistrer la tentative échouée si le middleware est présent
      if (req.recordFailedAttempt) req.recordFailedAttempt();
      
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si l'utilisateur est banni
    if (user.isBanned()) {
      return res.status(403).json({
        success: false,
        error: 'Votre compte a été suspendu',
        details: user.banReason
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(motDePasse);
    
    if (!isPasswordValid) {
      // Enregistrer la tentative échouée si le middleware est présent
      if (req.recordFailedAttempt) req.recordFailedAttempt();
      
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Réinitialiser les tentatives échouées si la connexion réussit
    if (req.clearFailedAttempts) req.clearFailedAttempts();

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      refreshToken,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        genre: user.genre,
        avatar: user.avatar,
        favoris: user.favoris,
        offresSpeciales: user.offresSpeciales,
        lastLogin: user.lastLogin
      }
    });

    console.log(`✅ Connexion réussie: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la connexion'
    });
  }
};

// @desc    Déconnexion d'un utilisateur
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  try {
    // Dans une implémentation complète, on pourrait ajouter le token à une blacklist
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la déconnexion'
    });
  }
};

// @desc    Récupérer le profil utilisateur
// @route   GET /api/auth/me
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favoris', 'titre prix dateLimite')
      .populate('reservations');

    res.json({
      success: true,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        genre: user.genre,
        avatar: user.avatar,
        favoris: user.favoris,
        offresSpeciales: user.offresSpeciales,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du profil'
    });
  }
};

// NOTE: Ancienne implémentation de updateProfile supprimée pour éviter les doublons.

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+motDePasse');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.motDePasse = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

    console.log(`✅ Mot de passe changé: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du changement de mot de passe'
    });
  }
};

// @desc    Demande de réinitialisation de mot de passe
// @route   POST /api/auth/forgot-password
// @access  Public
const { sendPasswordResetEmail } = require('../utils/email');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // For privacy, always return success even if user doesn't exist
    if (!user) {
      return res.json({
        success: true,
        message: 'Si un compte existe pour cet email, un message a été envoyé'
      });
    }

    // Generate reset token and save
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail({ to: user.email, token: resetToken });
    } catch (mailErr) {
      console.error('Erreur d\'envoi email reset:', mailErr);
      // Clean token on failure
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
      throw mailErr;
    }

    res.json({
      success: true,
      message: 'Si un compte existe pour cet email, un message a été envoyé'
    });

    console.log(`✅ Email de réinitialisation envoyé à: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la demande de réinitialisation'
    });
  }
};

// @desc    Réinitialiser le mot de passe
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+motDePasse');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    user.motDePasse = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      token: jwtToken
    });

    console.log(`✅ Mot de passe réinitialisé pour: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la réinitialisation'
    });
  }
};

// @desc    Rafraîchir le token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token manquant'
      });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    if (user.isBanned()) {
      return res.status(403).json({
        success: false,
        error: 'Compte suspendu'
      });
    }

    // Générer de nouveaux tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(401).json({
      success: false,
      error: 'Refresh token invalide'
    });
  }
};

// @desc    Supprimer le compte utilisateur
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'utilisateur (les middlewares pre-remove s'occuperont du nettoyage)
    await user.remove();

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });

    console.log(`✅ Compte supprimé: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du compte'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone, genre } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Update user fields
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (genre) user.genre = genre;

    // Gérer l'upload d'avatar
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(__dirname, '../../uploads');
      
      // Supprimer l'ancien avatar s'il existe
      if (user.avatar) {
        // Extraire le nom du fichier de l'URL (gère les URLs complètes et les chemins relatifs)
        let oldFilename;
        if (user.avatar.includes('avatar-')) {
          // Extraire le nom du fichier (dernier segment après le dernier /)
          oldFilename = user.avatar.split('/').pop();
          // Si le nom contient des paramètres de requête, les retirer
          oldFilename = oldFilename.split('?')[0];
          
          const oldAvatarPath = path.join(uploadDir, oldFilename);
          if (fs.existsSync(oldAvatarPath)) {
            try {
              fs.unlinkSync(oldAvatarPath);
              console.log(`🗑️ Ancien avatar supprimé: ${oldAvatarPath}`);
            } catch (err) {
              console.warn(`⚠️ Impossible de supprimer l'ancien avatar: ${err.message}`);
            }
          }
        }
      }
      
      // Construire l'URL de l'avatar
      // Sur Render, utiliser l'URL du backend directement
      let avatarUrl;
      if (process.env.NODE_ENV === 'production') {
        // En production, utiliser l'URL du backend depuis les variables d'environnement
        // S'assurer d'utiliser HTTPS
        let backendUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;
        
        // Si pas de variable d'environnement, construire depuis la requête
        if (!backendUrl) {
          // Utiliser HTTPS en production
          backendUrl = `https://${req.get('host')}`;
        }
        
        // S'assurer que l'URL utilise HTTPS (pas HTTP)
        if (backendUrl.startsWith('http://')) {
          backendUrl = backendUrl.replace('http://', 'https://');
        }
        
        avatarUrl = `${backendUrl}/uploads/${req.file.filename}`;
      } else {
        // En développement, utiliser localhost
        avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      }
      
      // Vérifier que le fichier existe bien
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ Fichier uploadé avec succès: ${req.file.filename} (${stats.size} bytes)`);
      } else {
        console.error(`❌ ERREUR: Le fichier n'existe pas après upload: ${filePath}`);
      }
      
      user.avatar = avatarUrl;
      console.log(`✅ Avatar URL: ${avatarUrl}`);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        genre: user.genre,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider
      }
    });

    console.log(`✅ Profil mis à jour pour: ${user.email}`);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du profil',
      details: error.message
    });
  }
};

module.exports = {
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
};
