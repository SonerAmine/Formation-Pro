/**
 * Configuration des variables d'environnement avec valeurs par défaut
 */

const loadEnvironmentVariables = () => {
  // Configuration de base
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.PORT = process.env.PORT || 5000;

  // Configuration MongoDB
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/formationpro';
  process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/formationpro_test';

  // Configuration JWT
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
  process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  // Configuration Frontend
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Configuration Email
  process.env.EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
  process.env.EMAIL_PORT = process.env.EMAIL_PORT || 587;
  process.env.EMAIL_USER = process.env.EMAIL_USER || '';
  process.env.EMAIL_PASS = process.env.EMAIL_PASS || '';

  // Configuration Rate Limiting
  process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || 900000; // 15 minutes
  process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || 100;

  // Configuration Sécurité
  process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || 12;

  // Configuration Upload
  process.env.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 5242880; // 5MB
  process.env.UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads/';

  // Configuration Logs
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

  // Configuration Google OAuth
  process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

  console.log('✅ Variables d\'environnement chargées avec succès');
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🚀 Port: ${process.env.PORT}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI}`);
};

module.exports = {
  loadEnvironmentVariables
};
