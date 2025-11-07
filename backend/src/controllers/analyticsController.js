const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const Formation = require('../models/Formation');
const Reservation = require('../models/Reservation');
const Comment = require('../models/Comment');

// @desc    Obtenir les statistiques globales de la plateforme
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
const getOverviewStats = async (req, res) => {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Statistiques de base
    const [
      totalUsers,
      totalFormations,
      totalReservations,
      totalComments,
      activeUsers,
      newUsersLast30Days,
      newUsersLast7Days
    ] = await Promise.all([
      User.countDocuments(),
      Formation.countDocuments(),
      Reservation.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({ 'engagementMetrics.lastActivity': { $gte: last7Days } }),
      User.countDocuments({ createdAt: { $gte: last30Days } }),
      User.countDocuments({ createdAt: { $gte: last7Days } })
    ]);

    // Statistiques d'engagement
    const engagementStats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgEScore: { $avg: '$engagementMetrics.eScore' },
          maxEScore: { $max: '$engagementMetrics.eScore' },
          minEScore: { $min: '$engagementMetrics.eScore' },
          totalSessions: { $sum: '$engagementMetrics.totalSessions' },
          totalDuration: { $sum: '$engagementMetrics.totalDuration' }
        }
      }
    ]);

    // Top utilisateurs par E-Score
    const topUsers = await User.find({ 'engagementMetrics.eScore': { $gt: 0 } })
      .select('nom prenom email engagementMetrics.eScore engagementMetrics.lastActivity')
      .sort({ 'engagementMetrics.eScore': -1 })
      .limit(10);

    // Statistiques des formations
    const formationStats = await Formation.aggregate([
      {
        $group: {
          _id: null,
          totalPlaces: { $sum: '$placesTotales' },
          reservedPlaces: { $sum: { $subtract: ['$placesTotales', '$placesRestantes'] } },
          avgPrice: { $avg: '$prix' },
          totalRevenue: { $sum: { $multiply: ['$prix', { $subtract: ['$placesTotales', '$placesRestantes'] }] } }
        }
      }
    ]);

    // Activité récente (dernières 24h)
    const recentActivity = await UserActivity.find({
      loginTime: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    })
      .populate('userId', 'nom prenom email')
      .sort({ loginTime: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalFormations,
          totalReservations,
          totalComments,
          activeUsers,
          newUsersLast30Days,
          newUsersLast7Days
        },
        engagement: engagementStats[0] || {
          avgEScore: 0,
          maxEScore: 0,
          minEScore: 0,
          totalSessions: 0,
          totalDuration: 0
        },
        topUsers,
        formations: formationStats[0] || {
          totalPlaces: 0,
          reservedPlaces: 0,
          avgPrice: 0,
          totalRevenue: 0
        },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};

// @desc    Obtenir les métriques d'engagement détaillées
// @route   GET /api/admin/analytics/engagement
// @access  Private/Admin
const getEngagementMetrics = async (req, res) => {
  try {
    const { period = 30, limit = 50, sortBy = 'eScore', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[`engagementMetrics.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find({ 'engagementMetrics.eScore': { $gt: 0 } })
      .select('nom prenom email engagementMetrics role createdAt')
      .populate('roleDetails', 'name description color icon')
      .sort(sort)
      .limit(parseInt(limit));

    // Calculer les statistiques d'engagement
    const engagementStats = await User.aggregate([
      {
        $match: { 'engagementMetrics.eScore': { $gt: 0 } }
      },
      {
        $group: {
          _id: null,
          avgEScore: { $avg: '$engagementMetrics.eScore' },
          avgFrequency: { $avg: '$engagementMetrics.frequency' },
          avgDuration: { $avg: '$engagementMetrics.avgSessionDuration' },
          avgInfluence: { $avg: '$engagementMetrics.influence' },
          avgEvaluation: { $avg: '$engagementMetrics.evaluation' },
          totalUsers: { $sum: 1 }
        }
      }
    ]);

    // Distribution des E-Scores
    const scoreDistribution = await User.aggregate([
      {
        $match: { 'engagementMetrics.eScore': { $gt: 0 } }
      },
      {
        $bucket: {
          groupBy: '$engagementMetrics.eScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: '100+',
          output: {
            count: { $sum: 1 },
            users: { $push: { nom: '$nom', prenom: '$prenom', email: '$email' } }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        users,
        stats: engagementStats[0] || {
          avgEScore: 0,
          avgFrequency: 0,
          avgDuration: 0,
          avgInfluence: 0,
          avgEvaluation: 0,
          totalUsers: 0
        },
        distribution: scoreDistribution,
        period: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des métriques d\'engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des métriques d\'engagement'
    });
  }
};

// @desc    Obtenir les détails d'engagement d'un utilisateur
// @route   GET /api/admin/analytics/user/:userId
// @access  Private/Admin
const getUserEngagementDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 30 } = req.query;

    const user = await User.findById(userId)
      .populate('roleDetails', 'name description permissions')
      .populate('favoris', 'titre prix')
      .populate('reservations');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Obtenir les métriques détaillées
    const eScoreData = await UserActivity.getEScore(userId, parseInt(period));
    const activityMetrics = await UserActivity.getUserEngagementMetrics(userId, parseInt(period));

    // Historique des sessions
    const sessions = await UserActivity.find({ userId })
      .sort({ loginTime: -1 })
      .limit(20)
      .select('loginTime logoutTime totalDuration totalPageViews totalFormationsViewed interactions');

    // Activité par jour (derniers 30 jours)
    const dailyActivity = await UserActivity.aggregate([
      {
        $match: {
          userId: user._id,
          loginTime: { $gte: new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$loginTime' }
          },
          sessions: { $sum: 1 },
          totalDuration: { $sum: '$totalDuration' },
          pageViews: { $sum: '$totalPageViews' },
          formationsViewed: { $sum: '$totalFormationsViewed' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Top formations consultées
    const topFormations = await UserActivity.aggregate([
      {
        $match: { userId: user._id }
      },
      {
        $unwind: '$formationsViewed'
      },
      {
        $group: {
          _id: '$formationsViewed.formationId',
          views: { $sum: 1 },
          totalDuration: { $sum: '$formationsViewed.duration' }
        }
      },
      {
        $lookup: {
          from: 'formations',
          localField: '_id',
          foreignField: '_id',
          as: 'formation'
        }
      },
      {
        $unwind: '$formation'
      },
      {
        $project: {
          titre: '$formation.titre',
          prix: '$formation.prix',
          views: 1,
          totalDuration: 1
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          roleDetails: user.roleDetails,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          engagementMetrics: user.engagementMetrics
        },
        eScore: eScoreData,
        activityMetrics,
        sessions,
        dailyActivity,
        topFormations
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des détails d\'engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des détails d\'engagement'
    });
  }
};

// @desc    Mettre à jour les métriques d'engagement de tous les utilisateurs
// @route   POST /api/admin/analytics/update-metrics
// @access  Private/Admin
const updateAllEngagementMetrics = async (req, res) => {
  try {
    const users = await User.find({});
    let updatedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await user.updateEngagementMetrics();
        updatedCount++;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de ${user.email}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Mise à jour terminée: ${updatedCount} utilisateurs mis à jour, ${errorCount} erreurs`,
      data: {
        updatedCount,
        errorCount,
        totalUsers: users.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des métriques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour des métriques'
    });
  }
};

// @desc    Obtenir les tendances d'activité
// @route   GET /api/admin/analytics/trends
// @access  Private/Admin
const getActivityTrends = async (req, res) => {
  try {
    const { period = 30, granularity = 'day' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let dateFormat;
    switch (granularity) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    // Tendances des connexions
    const loginTrends = await UserActivity.aggregate([
      {
        $match: {
          loginTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$loginTime' }
          },
          logins: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id',
          logins: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Tendances des réservations
    const reservationTrends = await Reservation.aggregate([
      {
        $match: {
          dateReservation: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$dateReservation' }
          },
          reservations: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          reservations: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Tendances des commentaires
    const commentTrends = await Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' }
          },
          comments: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          comments: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        loginTrends,
        reservationTrends,
        commentTrends,
        period: parseInt(period),
        granularity
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tendances:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des tendances'
    });
  }
};

module.exports = {
  getOverviewStats,
  getEngagementMetrics,
  getUserEngagementDetails,
  updateAllEngagementMetrics,
  getActivityTrends
};
