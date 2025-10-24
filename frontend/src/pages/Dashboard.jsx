import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import FormationModal from '../components/FormationModal';
import Toast from '../components/Toast';
import { api } from '../services/api';
import { debugFormationData } from '../utils/testFormationData';
import '../styles/Dashboard.css';
import '../styles/DashboardError.css';

const Dashboard = () => {
  const { user, isAdmin } = useContext(AuthContext);
  
  // Debug: Log pour surveiller les re-renders
  console.log('Dashboard render - User:', user?.email, 'Role:', user?.role, 'isAdmin:', isAdmin());
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFormations: 0,
    totalReservations: 0,
    totalRevenue: 0
  });
  const [users, setUsers] = useState([]);
  const [formations, setFormations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [creatingFormation, setCreatingFormation] = useState(false);
  const [editingFormation, setEditingFormation] = useState(null);
  const [updatingFormation, setUpdatingFormation] = useState(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Load dashboard data on mount
  useEffect(() => {
    // La vérification admin est déjà faite par ProtectedRoute
    // On charge simplement les données
    fetchDashboardData();
  }, []); // Dépendance vide pour éviter les re-renders

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, usersRes, formationsRes, reservationsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/formations'),
        api.get('/admin/reservations')
      ]);

      // S'assurer que nous avons les bonnes structures de données
      const statsData = statsRes.data?.data || statsRes.data || {};
      const usersData = usersRes.data?.data || [];
      const formationsData = formationsRes.data?.data || [];
      const reservationsData = reservationsRes.data?.data || [];
      
      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setFormations(Array.isArray(formationsData) ? formationsData : []);
      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // S'assurer que toutes les données sont initialisées en cas d'erreur
      setStats({});
      setUsers([]);
      setFormations([]);
      setReservations([]);
      
      const errorMessage = err.response?.data?.error || 'Erreur lors du chargement du tableau de bord';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, reason) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { reason });
      fetchDashboardData();
      showToast('Utilisateur banni avec succès', 'success');
    } catch (err) {
      console.error('Error banning user:', err);
      showToast('Erreur lors du bannissement', 'error');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/unban`);
      fetchDashboardData();
      showToast('Utilisateur débanni avec succès', 'success');
    } catch (err) {
      console.error('Error unbanning user:', err);
      showToast('Erreur lors du débannissement', 'error');
    }
  };

  const handleGiveSpecialOffer = async (userId, offers) => {
    try {
      await api.put(`/admin/users/${userId}/special-offer`, { offers });
      fetchDashboardData();
      showToast('Offre spéciale accordée avec succès', 'success');
    } catch (err) {
      console.error('Error giving special offer:', err);
      showToast('Erreur lors de l\'attribution de l\'offre', 'error');
    }
  };

  const handleCreateFormation = async (formationData) => {
    try {
      setCreatingFormation(true);
      
      // Debug: Afficher les données envoyées
      debugFormationData(formationData);
      
      const response = await api.post('/formations', formationData);
      
      if (response.data.success) {
        // Actualiser les données du dashboard
        await fetchDashboardData();
        
        // Fermer le modal
        setShowFormationModal(false);
        
        // Message de succès
        const message = formationData.statut === 'publiee' 
          ? 'Formation créée et publiée avec succès ! Visible immédiatement dans la liste.'
          : 'Formation sauvegardée en brouillon avec succès !';
        showToast(message, 'success');
      }
    } catch (err) {
      console.error('Error creating formation:', err);
      
      let errorMessage = 'Erreur lors de la création de la formation';
      
      if (err.response?.data?.details) {
        // Erreurs de validation détaillées
        const details = err.response.data.details;
        errorMessage = 'Erreurs de validation:\n' + 
          details.map(detail => `- ${detail.msg} (${detail.path})`).join('\n');
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      console.log('Formation data sent:', err.config?.data);
      showToast(errorMessage, 'error');
    } finally {
      setCreatingFormation(false);
    }
  };

  const handleEditFormation = (formation) => {
    setEditingFormation(formation);
    setShowFormationModal(true);
  };

  const handleUpdateFormation = async (formationData) => {
    try {
      setUpdatingFormation(true);
      
      const response = await api.put(`/formations/${editingFormation._id}`, formationData);
      
      if (response.data.success) {
        // Actualiser les données du dashboard
        await fetchDashboardData();
        
        // Fermer le modal et réinitialiser
        setShowFormationModal(false);
        setEditingFormation(null);
        
        // Message de succès
        showToast('Formation mise à jour avec succès !', 'success');
      }
    } catch (err) {
      console.error('Error updating formation:', err);
      
      let errorMessage = 'Erreur lors de la mise à jour de la formation';
      
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        errorMessage = 'Erreurs de validation:\n' + 
          details.map(detail => `- ${detail.msg} (${detail.path})`).join('\n');
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setUpdatingFormation(false);
    }
  };

  const handleCloseFormationModal = () => {
    setShowFormationModal(false);
    setEditingFormation(null);
  };

  // Toast functions
  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleDeleteFormation = async (formationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await api.delete(`/formations/${formationId}`);
      await fetchDashboardData();
      showToast('Formation supprimée avec succès', 'success');
    } catch (err) {
      console.error('Error deleting formation:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors de la suppression de la formation';
      showToast(errorMessage, 'error');
    }
  };

  // Vérification de sécurité supplémentaire (au cas où)
  if (!user || !isAdmin()) {
    console.warn('Dashboard: Non-admin user detected, should not happen with ProtectedRoute');
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h2>Accès non autorisé</h2>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h2>Erreur de chargement</h2>
        <p>{error}</p>
        <Button onClick={fetchDashboardData}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            <i className="fas fa-tachometer-alt"></i>
            Tableau de bord Admin
          </h1>
          <p className="dashboard-subtitle">
            Bienvenue {user?.prenom}, gérez votre plateforme en toute simplicité
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-nav">
          <button
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-line"></i>
            Vue d'ensemble
          </button>
          <button
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            Utilisateurs
          </button>
          <button
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fas fa-chart-line"></i>
            Analytics
          </button>
          <button
            className={`nav-tab ${activeTab === 'formations' ? 'active' : ''}`}
            onClick={() => setActiveTab('formations')}
          >
            <i className="fas fa-graduation-cap"></i>
            Formations
          </button>
          <button
            className={`nav-tab ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <i className="fas fa-calendar-check"></i>
            Réservations
          </button>
        </div>

        {/* Tab Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.totalUsers || 0}</h3>
                    <p className="stat-label">Utilisateurs</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon formations">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.totalFormations || 0}</h3>
                    <p className="stat-label">Formations</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon reservations">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.totalReservations || 0}</h3>
                    <p className="stat-label">Réservations</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon revenue">
                    <i className="fas fa-euro-sign"></i>
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-number">{stats.totalRevenue || 0}€</h3>
                    <p className="stat-label">Chiffre d'affaires</p>
                  </div>
                </div>
              </div>

              <div className="overview-charts">
                <div className="chart-section">
                  <h3>Activité récente</h3>
                  <div className="recent-activities">
                    <div className="activity-item">
                      <i className="fas fa-user-plus"></i>
                      <span>Nouveau utilisateur inscrit</span>
                      <span className="time">Il y a 2h</span>
                    </div>
                    <div className="activity-item">
                      <i className="fas fa-calendar-plus"></i>
                      <span>Nouvelle réservation</span>
                      <span className="time">Il y a 4h</span>
                    </div>
                    <div className="activity-item">
                      <i className="fas fa-graduation-cap"></i>
                      <span>Formation créée</span>
                      <span className="time">Il y a 1j</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="tab-header">
                <h2>Gestion des utilisateurs</h2>
                <div className="tab-actions">
                  <Button
                    variant="primary"
                    icon={<i className="fas fa-plus"></i>}
                    onClick={() => showToast('Fonctionnalité en développement - Création d\'utilisateur', 'info')}
                  >
                    Ajouter un utilisateur
                  </Button>
                </div>
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Statut</th>
                      <th>Inscrit le</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                            </div>
                            <div>
                              <div className="user-name">{user.prenom} {user.nom}</div>
                              <div className="user-phone">{user.telephone}</div>
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.banned ? 'banned' : 'active'}`}>
                            {user.banned ? 'Banni' : 'Actif'}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <div className="action-buttons">
                            {user.banned ? (
                              <Button
                                variant="success"
                                size="small"
                                onClick={() => handleUnbanUser(user._id)}
                              >
                                Débannir
                              </Button>
                            ) : (
                              <Button
                                variant="error"
                                size="small"
                                onClick={() => {
                                  const reason = prompt('Raison du bannissement:');
                                  if (reason) handleBanUser(user._id, reason);
                                }}
                              >
                                Bannir
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => {
                                const offers = prompt('Nombre d\'offres spéciales à accorder:');
                                if (offers) handleGiveSpecialOffer(user._id, parseInt(offers));
                              }}
                            >
                              Offre spéciale
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-chart-line"></i>
                  Analytics & Engagement
                </h2>
                <p>Surveillance et analyse de l'engagement utilisateur en temps réel</p>
              </div>
              
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="card-header">
                    <h3>E-Score Global</h3>
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="card-content">
                    <div className="score-display">
                      <span className="score-value">85</span>
                      <span className="score-label">Excellent</span>
                    </div>
                    <div className="score-breakdown">
                      <div className="breakdown-item">
                        <span>Récence</span>
                        <span>90</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Fréquence</span>
                        <span>85</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Durée</span>
                        <span>80</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Influence</span>
                        <span>85</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Évaluation</span>
                        <span>90</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h3>Activité Récente</h3>
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="card-content">
                    <div className="activity-list">
                      <div className="activity-item">
                        <div className="activity-icon">
                          <i className="fas fa-user-plus"></i>
                        </div>
                        <div className="activity-details">
                          <div className="activity-title">Nouvel utilisateur</div>
                          <div className="activity-subtitle">Jean Dupont s'est inscrit</div>
                          <div className="activity-time">Il y a 5 minutes</div>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-icon">
                          <i className="fas fa-graduation-cap"></i>
                        </div>
                        <div className="activity-details">
                          <div className="activity-title">Formation réservée</div>
                          <div className="activity-subtitle">Marie Martin a réservé "React Avancé"</div>
                          <div className="activity-time">Il y a 15 minutes</div>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-icon">
                          <i className="fas fa-comment"></i>
                        </div>
                        <div className="activity-details">
                          <div className="activity-title">Nouveau commentaire</div>
                          <div className="activity-subtitle">Pierre Durand a commenté "JavaScript"</div>
                          <div className="activity-time">Il y a 30 minutes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h3>Top Utilisateurs</h3>
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className="card-content">
                    <div className="top-users-list">
                      <div className="user-rank-item">
                        <div className="rank-number">1</div>
                        <div className="user-info">
                          <div className="user-name">Alice Martin</div>
                          <div className="user-score">E-Score: 95</div>
                        </div>
                        <div className="user-avatar">AM</div>
                      </div>
                      <div className="user-rank-item">
                        <div className="rank-number">2</div>
                        <div className="user-info">
                          <div className="user-name">Bob Dupont</div>
                          <div className="user-score">E-Score: 88</div>
                        </div>
                        <div className="user-avatar">BD</div>
                      </div>
                      <div className="user-rank-item">
                        <div className="rank-number">3</div>
                        <div className="user-info">
                          <div className="user-name">Claire Durand</div>
                          <div className="user-score">E-Score: 82</div>
                        </div>
                        <div className="user-avatar">CD</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h3>Métriques d'Engagement</h3>
                    <i className="fas fa-chart-bar"></i>
                  </div>
                  <div className="card-content">
                    <div className="metrics-grid">
                      <div className="metric-item">
                        <div className="metric-value">156</div>
                        <div className="metric-label">Sessions totales</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">2.5h</div>
                        <div className="metric-label">Durée moyenne</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">78%</div>
                        <div className="metric-label">Taux d'engagement</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">24</div>
                        <div className="metric-label">Utilisateurs actifs</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-actions">
                <Button
                  variant="primary"
                  onClick={() => window.open('/analytics', '_blank')}
                  icon={<i className="fas fa-external-link-alt"></i>}
                >
                  Voir Analytics Détaillées
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Fonction pour mettre à jour les métriques
                    alert('Mise à jour des métriques d\'engagement en cours...');
                  }}
                  icon={<i className="fas fa-sync-alt"></i>}
                >
                  Mettre à jour les Métriques
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'formations' && (
            <div className="formations-tab">
              <div className="tab-header">
                <h2>Gestion des formations</h2>
                <div className="tab-actions">
                  <Button
                    variant="primary"
                    icon={<i className="fas fa-plus"></i>}
                    onClick={() => setShowFormationModal(true)}
                  >
                    Ajouter une formation
                  </Button>
                </div>
              </div>

              <div className="formations-grid">
                {formations.map(formation => (
                  <div key={formation._id} className="formation-admin-card">
                    <div className="card-header">
                      <h3>{formation.titre}</h3>
                      <div className="card-actions">
                        <Button
                          variant="outline"
                          size="small"
                          icon={<i className="fas fa-edit"></i>}
                          onClick={() => handleEditFormation(formation)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="error"
                          size="small"
                          icon={<i className="fas fa-trash"></i>}
                          onClick={() => handleDeleteFormation(formation._id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <p className="formation-description">{formation.description.substring(0, 100)}...</p>
                      
                      <div className="formation-meta">
                        <span className={`status-badge ${formation.statut}`}>
                          {formation.statut === 'publiee' ? 'Publiée' : 'Brouillon'}
                        </span>
                        <span className={`category-badge ${formation.categorie}`}>
                          {formation.categorie}
                        </span>
                      </div>
                      
                      <div className="formation-stats">
                        <div className="stat">
                          <i className="fas fa-euro-sign"></i>
                          <span>{formation.prix}€</span>
                        </div>
                        <div className="stat">
                          <i className="fas fa-users"></i>
                          <span>{formation.placesRestantes}/{formation.placesTotales}</span>
                        </div>
                        <div className="stat">
                          <i className="fas fa-calendar"></i>
                          <span>
                            {formation.dateDebut 
                              ? new Date(formation.dateDebut).toLocaleDateString('fr-FR')
                              : 'Date à définir'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="reservations-tab">
              <div className="tab-header">
                <h2>Gestion des réservations</h2>
              </div>

              <div className="reservations-table">
                <table>
                  <thead>
                    <tr>
                      <th>Formation</th>
                      <th>Utilisateur</th>
                      <th>Date de réservation</th>
                      <th>Statut</th>
                      <th>Prix</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map(reservation => (
                      <tr key={reservation._id}>
                        <td>{reservation.formationId?.titre || 'Formation supprimée'}</td>
                        <td>
                          <div className="user-info">
                            <div>{reservation.prenom} {reservation.nom}</div>
                            <div className="user-email">{reservation.email}</div>
                          </div>
                        </td>
                        <td>{new Date(reservation.dateReservation).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <span className={`status-badge ${reservation.statut}`}>
                            {reservation.statut}
                          </span>
                        </td>
                        <td>{reservation.formationId?.prix || 0}€</td>
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => showToast('Voir détails - Fonctionnalité en développement', 'info')}
                            >
                              Détails
                            </Button>
                            {reservation.statut === 'active' && (
                              <Button
                                variant="error"
                                size="small"
                                onClick={() => {
                                  if (window.confirm('Annuler cette réservation ?')) {
                                    showToast('Fonctionnalité en développement', 'info');
                                  }
                                }}
                              >
                                Annuler
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Formation Modal */}
      <FormationModal
        isOpen={showFormationModal}
        onClose={handleCloseFormationModal}
        onSubmit={editingFormation ? handleUpdateFormation : handleCreateFormation}
        loading={editingFormation ? updatingFormation : creatingFormation}
        editData={editingFormation}
        isEditing={!!editingFormation}
      />
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
