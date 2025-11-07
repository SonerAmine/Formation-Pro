const UserActivity = require('../models/UserActivity');
const User = require('../models/User');

// Middleware pour enregistrer l'activité utilisateur
const trackUserActivity = (activityType, metadata = {}) => {
  return async (req, res, next) => {
    try {
      // Exécuter la route d'abord
      await next();
      
      // Enregistrer l'activité après la réponse
      if (req.user && req.user.id) {
        const activityData = {
          sessionId: req.sessionID || 'unknown',
          deviceInfo: {
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            platform: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
            browser: extractBrowser(req.get('User-Agent'))
          },
          location: {
            // Ici on pourrait intégrer un service de géolocalisation
            country: 'Unknown',
            city: 'Unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          ...metadata
        };
        
        // Enregistrer l'activité de manière asynchrone
        setImmediate(async () => {
          try {
            await req.user.recordActivity(activityType, activityData);
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
          }
        });
      }
    } catch (error) {
      console.error('Erreur dans le middleware d\'activité:', error);
      next(error);
    }
  };
};

// Middleware pour enregistrer les vues de pages
const trackPageView = (pageName) => {
  return async (req, res, next) => {
    try {
      await next();
      
      if (req.user && req.user.id) {
        const startTime = Date.now();
        
        // Enregistrer la vue de page
        setImmediate(async () => {
          try {
            const UserActivity = require('../models/UserActivity');
            const duration = Date.now() - startTime;
            
            await UserActivity.findOneAndUpdate(
              { userId: req.user.id, sessionId: req.sessionID || 'unknown' },
              {
                $push: {
                  pageViews: {
                    page: pageName,
                    timestamp: new Date(),
                    duration: Math.round(duration / 1000) // en secondes
                  }
                }
              },
              { upsert: true, new: true }
            );
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la vue de page:', error);
          }
        });
      }
    } catch (error) {
      console.error('Erreur dans le middleware de vue de page:', error);
      next(error);
    }
  };
};

// Middleware pour enregistrer les vues de formations
const trackFormationView = () => {
  return async (req, res, next) => {
    try {
      await next();
      
      if (req.user && req.user.id && req.params.id) {
        const formationId = req.params.id;
        const startTime = Date.now();
        
        setImmediate(async () => {
          try {
            const UserActivity = require('../models/UserActivity');
            const duration = Date.now() - startTime;
            
            await UserActivity.findOneAndUpdate(
              { userId: req.user.id, sessionId: req.sessionID || 'unknown' },
              {
                $push: {
                  formationsViewed: {
                    formationId,
                    timestamp: new Date(),
                    duration: Math.round(duration / 1000) // en secondes
                  }
                }
              },
              { upsert: true, new: true }
            );
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la vue de formation:', error);
          }
        });
      }
    } catch (error) {
      console.error('Erreur dans le middleware de vue de formation:', error);
      next(error);
    }
  };
};

// Middleware pour mettre à jour les métriques d'engagement
const updateEngagementMetrics = () => {
  return async (req, res, next) => {
    try {
      await next();
      
      if (req.user && req.user.id) {
        // Mettre à jour les métriques de manière asynchrone
        setImmediate(async () => {
          try {
            await req.user.updateEngagementMetrics();
          } catch (error) {
            console.error('Erreur lors de la mise à jour des métriques:', error);
          }
        });
      }
    } catch (error) {
      console.error('Erreur dans le middleware de métriques:', error);
      next(error);
    }
  };
};

// Fonction utilitaire pour extraire le navigateur
const extractBrowser = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Other';
};

// Middleware pour vérifier les permissions basées sur les rôles
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }
      
      const hasPermission = await req.user.hasPermission(resource, action, {
        userId: req.user.id,
        userRole: req.user.role
      });
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Permissions insuffisantes pour cette action'
        });
      }
      
      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la vérification des permissions'
      });
    }
  };
};

// Middleware pour enregistrer les sessions de connexion
const trackLoginSession = () => {
  return async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Intercepter la réponse pour enregistrer la session
      const originalSend = res.send;
      res.send = function(data) {
        // Enregistrer la session après une connexion réussie
        if (req.user && req.user.id && res.statusCode === 200) {
          setImmediate(async () => {
            try {
              const UserActivity = require('../models/UserActivity');
              const sessionData = {
                userId: req.user.id,
                sessionId: req.sessionID || 'unknown',
                loginTime: new Date(),
                deviceInfo: {
                  userAgent: req.get('User-Agent'),
                  ip: req.ip || req.connection.remoteAddress,
                  platform: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
                  browser: extractBrowser(req.get('User-Agent'))
                },
                interactions: [{
                  type: 'login',
                  timestamp: new Date(),
                  metadata: {
                    loginMethod: req.body.email ? 'email' : 'google',
                    success: true
                  }
                }]
              };
              
              const activity = new UserActivity(sessionData);
              await activity.save();
              
              // Mettre à jour la dernière connexion de l'utilisateur
              await User.findByIdAndUpdate(req.user.id, {
                lastLogin: new Date(),
                'engagementMetrics.lastActivity': new Date()
              });
            } catch (error) {
              console.error('Erreur lors de l\'enregistrement de la session:', error);
            }
          });
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Erreur dans le middleware de session:', error);
      next(error);
    }
  };
};

module.exports = {
  trackUserActivity,
  trackPageView,
  trackFormationView,
  updateEngagementMetrics,
  checkPermission,
  trackLoginSession
};
