const notFound = (req, res, next) => {
  // Routes communes du navigateur - ne pas les traiter comme des erreurs importantes
  const commonRoutes = [
    '/',
    '/favicon.ico',
    '/.well-known/appspecific/com.chrome.devtools.json',
    '/robots.txt',
    '/sitemap.xml'
  ];
  
  // Si c'est une route commune, retourner une réponse simple sans erreur
  if (commonRoutes.includes(req.originalUrl)) {
    if (req.originalUrl === '/') {
      return res.status(200).json({
        success: true,
        message: 'API FormationPro - Backend fonctionnel',
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          formations: '/api/formations',
          reservations: '/api/reservations',
          comments: '/api/comments',
          admin: '/api/admin'
        }
      });
    }
    
    if (req.originalUrl === '/favicon.ico') {
      return res.status(204).end(); // No Content
    }
    
    // Autres routes communes - réponse vide
    return res.status(404).json({
      success: false,
      error: 'Ressource non disponible'
    });
  }
  
  // Pour les vraies routes API manquantes, créer une erreur
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  // Si l'erreur n'a pas de status code, définir 500 par défaut
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Erreurs spécifiques de MongoDB
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Ressource non trouvée';
  }

  // Erreur de validation MongoDB
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(error => error.message);
    message = errors.join(', ');
  }

  // Erreur de duplication MongoDB (index unique)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Un utilisateur avec cet ${field} existe déjà`;
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token non valide';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  // Log détaillé en développement (sauf pour les erreurs 404 communes)
  if (process.env.NODE_ENV === 'development' && statusCode !== 404) {
    console.error('🔥 Error Stack:', err.stack);
  } else if (process.env.NODE_ENV === 'development' && statusCode === 404 && !err.message.includes('favicon.ico') && !err.message.includes('.well-known')) {
    console.warn('⚠️  Route 404:', err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

module.exports = {
  notFound,
  errorHandler
};
