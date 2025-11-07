const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Charger les variables d'environnement avec valeurs par défaut
const { loadEnvironmentVariables } = require('./config/env');
loadEnvironmentVariables();

// Import de la configuration de la base de données
const connectDB = require('./config/db');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const formationRoutes = require('./routes/formationRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const roleRoutes = require('./routes/roleRoutes');

// Import des middlewares
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Création de l'application Express
const app = express();

// Configuration du port
const PORT = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

// ===== CONFIGURATION POUR RENDER (TRUST PROXY) =====
// Render utilise un proxy, il faut faire confiance aux headers X-Forwarded-*
app.set('trust proxy', 1);

// ===== MIDDLEWARES DE SÉCURITÉ =====

// Helmet pour sécuriser les headers HTTP
// Configuration ajustée pour Google OAuth
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" } // Nécessaire pour Google OAuth popup
}));

// Configuration CORS améliorée
const corsOptions = {
  origin: function (origin, callback) {
    // Construire la liste des origines autorisées
    const allowedOrigins = [];
    
    // Ajouter l'URL du frontend depuis les variables d'environnement
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
      // Ajouter aussi sans le trailing slash si présent
      if (process.env.FRONTEND_URL.endsWith('/')) {
        allowedOrigins.push(process.env.FRONTEND_URL.slice(0, -1));
      } else {
        allowedOrigins.push(process.env.FRONTEND_URL + '/');
      }
    }
    
    // Ajouter les origines de développement
    allowedOrigins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    );
    
    // En production sur Render, permettre toutes les URLs *.onrender.com (pour flexibilité)
    if (process.env.NODE_ENV === 'production') {
      // Si l'origine est une URL Render, l'autoriser
      if (origin && origin.includes('.onrender.com')) {
        return callback(null, true);
      }
    }
    
    // Permettre les requêtes sans origin (ex: applications mobile, Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Vérifier si l'origine est exactement dans la liste autorisée
    const isAllowed = allowedOrigins.includes(origin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Log pour debug
      console.log(`🌐 Requête CORS depuis: ${origin}`);
      console.log(`✅ Origines autorisées:`, allowedOrigins);
      console.log(`🔧 FRONTEND_URL:`, process.env.FRONTEND_URL);
      // Autoriser quand même si c'est une URL Render en production (pour éviter les problèmes)
      if (process.env.NODE_ENV === 'production' && origin && origin.includes('.onrender.com')) {
        console.log(`✅ Autorisation automatique pour Render: ${origin}`);
        return callback(null, true);
      }
      callback(new Error(`Non autorisé par CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 heures
};

app.use(cors(corsOptions));

// Rate limiting avec configuration pour Render (trust proxy)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limite chaque IP à 100 requêtes par windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configurer pour Render (utilise X-Forwarded-For)
  trustProxy: true,
  skip: (req) => {
    // Skip rate limiting pour les health checks
    return req.path === '/health' || req.path === '/api/test';
  }
});

app.use(limiter);

// Rate limiting plus strict pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite chaque IP à 10 tentatives de connexion par fenêtre de 15 minutes
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
  },
  skipSuccessfulRequests: true,
  // Configurer pour Render (utilise X-Forwarded-For)
  trustProxy: true
});

// ===== MIDDLEWARES GÉNÉRAUX =====

// Logging des requêtes
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parser JSON avec limite de taille
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Parser URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (avatars uploadés)
// Le chemin doit être absolu pour fonctionner sur Render
const path = require('path');
const uploadsPath = path.join(__dirname, '../../uploads');

// Middleware pour servir les fichiers statiques avec les bons headers
app.use('/uploads', (req, res, next) => {
  // Ajouter les headers CORS pour les images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(uploadsPath, {
  // Options pour servir les fichiers statiques
  maxAge: '1d', // Cache les fichiers pendant 1 jour
  etag: true,
  lastModified: true
}));

// Log pour debug
console.log(`📁 Uploads directory: ${uploadsPath}`);

// ===== ROUTES =====

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API FormationPro fonctionne correctement',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Routes API avec préfixe /api
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', require('./routes/userRoutes')); // Route pour la gestion des utilisateurs
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/roles', roleRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API FormationPro - Test réussi!',
    timestamp: new Date().toISOString()
  });
});

// ===== GESTION D'ERREURS =====

// Middleware pour les routes non trouvées
app.use(notFound);

// Middleware de gestion d'erreurs global
app.use(errorHandler);

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// ===== DÉMARRAGE DU SERVEUR =====

const server = app.listen(PORT, () => {
  console.log(`
🚀 =================================
📱 FormationPro API Server
🌟 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🕒 Started at: ${new Date().toLocaleString('fr-FR')}
🔗 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
=================================
  `);
});

// Export pour les tests
module.exports = app;
