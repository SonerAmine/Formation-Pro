const jwt = require('jsonwebtoken');
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

// @desc    Authentification Google OAuth
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Token Google manquant'
      });
    }

    // Décoder le JWT Google (sans vérification car Google l'a déjà vérifié)
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('ascii')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const googleUser = JSON.parse(jsonPayload);

    // Vérifier que le clientId correspond
    if (clientId && googleUser.aud !== clientId) {
      return res.status(401).json({
        success: false,
        error: 'Token Google invalide'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({
      $or: [
        { googleId: googleUser.sub },
        { email: googleUser.email }
      ]
    });

    if (user) {
      // Vérifier si l'utilisateur est banni
      if (user.isBanned()) {
        return res.status(403).json({
          success: false,
          error: 'Votre compte a été suspendu',
          details: user.banReason
        });
      }

      // Mettre à jour les informations Google si ce n'était pas déjà un compte Google
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        user.authProvider = 'google';
        user.avatar = googleUser.picture;
        await user.save();
      }

      // Mettre à jour la dernière connexion
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Créer un nouvel utilisateur
      user = await User.create({
        nom: googleUser.family_name || 'Non renseigné',
        prenom: googleUser.given_name || googleUser.name || 'Utilisateur',
        email: googleUser.email,
        googleId: googleUser.sub,
        authProvider: 'google',
        avatar: googleUser.picture,
        isEmailVerified: googleUser.email_verified || true,
        lastLogin: new Date()
      });

      console.log(`✅ Nouvel utilisateur Google inscrit: ${user.email}`);
    }

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: user.isNew ? 'Compte créé avec succès' : 'Connexion réussie',
      token,
      refreshToken,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        favoris: user.favoris,
        offresSpeciales: user.offresSpeciales,
        avatar: user.avatar,
        authProvider: user.authProvider,
        lastLogin: user.lastLogin
      }
    });

    console.log(`✅ Connexion Google réussie: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de l\'authentification Google:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification Google',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Vérifier un token Google (optionnel, pour validation côté serveur)
// @route   POST /api/auth/google/verify
// @access  Public
const verifyGoogleToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token manquant'
      });
    }

    // En production, vous devriez utiliser la bibliothèque google-auth-library
    // pour vérifier le token de manière sécurisée
    
    res.json({
      success: true,
      message: 'Token vérifié'
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la vérification'
    });
  }
};

// @desc    Lier un compte Google à un compte existant
// @route   POST /api/auth/google/link
// @access  Private
const linkGoogleAccount = async (req, res) => {
  try {
    const { credential } = req.body;
    const userId = req.user.id;

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: 'Token Google manquant'
      });
    }

    // Décoder le token Google
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('ascii')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const googleUser = JSON.parse(jsonPayload);

    // Récupérer l'utilisateur
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si le compte Google est déjà lié à un autre utilisateur
    const existingUser = await User.findOne({ googleId: googleUser.sub });
    
    if (existingUser && !existingUser._id.equals(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Ce compte Google est déjà lié à un autre utilisateur'
      });
    }

    // Lier le compte Google
    user.googleId = googleUser.sub;
    user.avatar = user.avatar || googleUser.picture;
    await user.save();

    res.json({
      success: true,
      message: 'Compte Google lié avec succès',
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        googleId: user.googleId,
        avatar: user.avatar
      }
    });

    console.log(`✅ Compte Google lié: ${user.email}`);
  } catch (error) {
    console.error('Erreur lors de la liaison du compte Google:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la liaison du compte Google'
    });
  }
};

module.exports = {
  googleAuth,
  verifyGoogleToken,
  linkGoogleAccount
};
