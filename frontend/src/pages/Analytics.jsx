import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../styles/Analytics.css';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (activeTab) {
        case 'overview':
          response = await api.get('/admin/analytics/overview');
          break;
        case 'engagement':
          response = await api.get(`/admin/analytics/engagement?period=${selectedPeriod}`);
          break;
        case 'trends':
          response = await api.get(`/admin/analytics/trends?period=${selectedPeriod}`);
          break;
        default:
          response = await api.get('/admin/analytics/overview');
      }
      
      setData(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const response = await api.get(`/admin/analytics/user/${userId}?period=${selectedPeriod}`);
      setSelectedUser(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails utilisateur:', error);
    }
  };

  const updateAllMetrics = async () => {
    try {
      await api.post('/admin/analytics/update-metrics');
      alert('Mise à jour des métriques terminée !');
      fetchAnalyticsData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des métriques:', error);
    }
  };

  const getEScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // Vert
    if (score >= 60) return '#F59E0B'; // Orange
    if (score >= 40) return '#EF4444'; // Rouge
    return '#6B7280'; // Gris
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>
          <i className="fas fa-chart-line"></i>
          Analytics & Engagement
        </h1>
        <div className="analytics-controls">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="period-selector"
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
          </select>
          <button onClick={updateAllMetrics} className="update-metrics-btn">
            <i className="fas fa-sync-alt"></i>
            Mettre à jour
          </button>
        </div>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-tachometer-alt"></i>
          Vue d'ensemble
        </button>
        <button 
          className={`tab ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          <i className="fas fa-users"></i>
          Engagement
        </button>
        <button 
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <i className="fas fa-chart-area"></i>
          Tendances
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatNumber(data.overview?.totalUsers || 0)}</h3>
                  <p>Utilisateurs total</p>
                  <div className="stat-change positive">
                    +{formatNumber(data.overview?.newUsersLast7Days || 0)} cette semaine
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatNumber(data.overview?.totalFormations || 0)}</h3>
                  <p>Formations</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatNumber(data.overview?.totalReservations || 0)}</h3>
                  <p>Réservations</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-user-check"></i>
                </div>
                <div className="stat-content">
                  <h3>{formatNumber(data.overview?.activeUsers || 0)}</h3>
                  <p>Utilisateurs actifs</p>
                </div>
              </div>
            </div>

            <div className="engagement-overview">
              <h2>Métriques d'Engagement</h2>
              <div className="engagement-stats">
                <div className="engagement-metric">
                  <div className="metric-label">E-Score Moyen</div>
                  <div className="metric-value" style={{ color: getEScoreColor(data.engagement?.avgEScore || 0) }}>
                    {Math.round(data.engagement?.avgEScore || 0)}
                  </div>
                </div>
                <div className="engagement-metric">
                  <div className="metric-label">Sessions Total</div>
                  <div className="metric-value">{formatNumber(data.engagement?.totalSessions || 0)}</div>
                </div>
                <div className="engagement-metric">
                  <div className="metric-label">Durée Moyenne</div>
                  <div className="metric-value">{formatDuration(data.engagement?.avgSessionDuration || 0)}</div>
                </div>
              </div>
            </div>

            <div className="top-users">
              <h2>Top Utilisateurs par E-Score</h2>
              <div className="users-list">
                {data.topUsers?.map((user, index) => (
                  <div key={user.id} className="user-item" onClick={() => handleUserClick(user.id)}>
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-info">
                      <div className="user-name">{user.prenom} {user.nom}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-score" style={{ color: getEScoreColor(user.engagementMetrics?.eScore || 0) }}>
                      {user.engagementMetrics?.eScore || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="engagement-section">
            <div className="engagement-header">
              <h2>Analyse d'Engagement Détaillée</h2>
              <div className="engagement-summary">
                <div className="summary-item">
                  <span className="summary-label">Utilisateurs analysés:</span>
                  <span className="summary-value">{data.stats?.totalUsers || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">E-Score moyen:</span>
                  <span className="summary-value" style={{ color: getEScoreColor(data.stats?.avgEScore || 0) }}>
                    {Math.round(data.stats?.avgEScore || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="score-distribution">
              <h3>Distribution des E-Scores</h3>
              <div className="distribution-chart">
                {data.distribution?.map((bucket, index) => (
                  <div key={index} className="distribution-bar">
                    <div className="bar-label">{bucket._id}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${(bucket.count / Math.max(...data.distribution.map(b => b.count))) * 100}%`,
                          backgroundColor: getEScoreColor(parseInt(bucket._id) || 0)
                        }}
                      ></div>
                    </div>
                    <div className="bar-count">{bucket.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="users-table">
              <h3>Utilisateurs par Engagement</h3>
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>E-Score</th>
                    <th>Fréquence</th>
                    <th>Durée Moy.</th>
                    <th>Influence</th>
                    <th>Évaluation</th>
                    <th>Dernière Activité</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users?.map((user) => (
                    <tr key={user.id} onClick={() => handleUserClick(user.id)} className="clickable-row">
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                          </div>
                          <div className="user-details">
                            <div className="user-name">{user.prenom} {user.nom}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="score-badge" 
                          style={{ backgroundColor: getEScoreColor(user.engagementMetrics?.eScore || 0) }}
                        >
                          {user.engagementMetrics?.eScore || 0}
                        </span>
                      </td>
                      <td>{Math.round((user.engagementMetrics?.frequency || 0) * 100)}%</td>
                      <td>{formatDuration(user.engagementMetrics?.avgSessionDuration || 0)}</td>
                      <td>{Math.round(user.engagementMetrics?.influence || 0)}</td>
                      <td>{Math.round(user.engagementMetrics?.evaluation || 0)}</td>
                      <td>
                        {user.engagementMetrics?.lastActivity 
                          ? new Date(user.engagementMetrics.lastActivity).toLocaleDateString('fr-FR')
                          : 'Jamais'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="trends-section">
            <h2>Tendances d'Activité</h2>
            <div className="trends-charts">
              <div className="chart-container">
                <h3>Connexions par Jour</h3>
                <div className="chart">
                  {data.loginTrends?.map((trend, index) => (
                    <div key={index} className="chart-bar">
                      <div className="bar-value" style={{ height: `${(trend.logins / Math.max(...data.loginTrends.map(t => t.logins))) * 100}%` }}></div>
                      <div className="bar-label">{trend.date}</div>
                      <div className="bar-tooltip">{trend.logins} connexions</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-container">
                <h3>Réservations par Jour</h3>
                <div className="chart">
                  {data.reservationTrends?.map((trend, index) => (
                    <div key={index} className="chart-bar">
                      <div className="bar-value" style={{ height: `${(trend.reservations / Math.max(...data.reservationTrends.map(t => t.reservations))) * 100}%` }}></div>
                      <div className="bar-label">{trend.date}</div>
                      <div className="bar-tooltip">{trend.reservations} réservations</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="user-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Détails d'Engagement - {selectedUser.user.prenom} {selectedUser.user.nom}</h2>
              <button onClick={() => setSelectedUser(null)} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="user-e-score">
                <h3>E-Score: {selectedUser.eScore?.eScore || 0}</h3>
                <div className="score-breakdown">
                  <div className="score-item">
                    <span>Récence:</span>
                    <span>{Math.round(selectedUser.eScore?.breakdown?.recency || 0)}</span>
                  </div>
                  <div className="score-item">
                    <span>Fréquence:</span>
                    <span>{Math.round(selectedUser.eScore?.breakdown?.frequency || 0)}</span>
                  </div>
                  <div className="score-item">
                    <span>Durée:</span>
                    <span>{Math.round(selectedUser.eScore?.breakdown?.duration || 0)}</span>
                  </div>
                  <div className="score-item">
                    <span>Influence:</span>
                    <span>{Math.round(selectedUser.eScore?.breakdown?.influence || 0)}</span>
                  </div>
                  <div className="score-item">
                    <span>Évaluation:</span>
                    <span>{Math.round(selectedUser.eScore?.breakdown?.evaluation || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
