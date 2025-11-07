import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { api } from '../services/api';
import '../styles/MyReservations.css';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservations/my');
      // S'assurer que nous avons un tableau
      const reservationsData = response.data?.data || [];
      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors du chargement des réservations';
      setError(errorMessage);
      // S'assurer que les réservations restent un tableau vide en cas d'erreur
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      setCancellingId(reservationId);
      await api.put(`/reservations/${reservationId}/cancel`);
      
      // Update local state
      setReservations(prev => 
        prev.map(reservation => 
          reservation._id === reservationId 
            ? { ...reservation, statut: 'annulée' }
            : reservation
        )
      );
      
      alert('Réservation annulée avec succès');
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      alert('Erreur lors de l\'annulation de la réservation');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancelReservation = (reservation) => {
    // Can cancel if status is active (plus de limite de date)
    return reservation.statut === 'active';
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'active':
        return { icon: 'fas fa-check-circle', class: 'status-active' };
      case 'annulée':
        return { icon: 'fas fa-times-circle', class: 'status-cancelled' };
      case 'terminée':
        return { icon: 'fas fa-flag-checkered', class: 'status-completed' };
      default:
        return { icon: 'fas fa-clock', class: 'status-pending' };
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'active':
        return 'Confirmée';
      case 'annulée':
        return 'Annulée';
      case 'terminée':
        return 'Terminée';
      default:
        return 'En attente';
    }
  };

  if (loading) {
    return (
      <div className="my-reservations-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de vos réservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-reservations-error">
        <div className="error-icon">⚠️</div>
        <h2>Erreur de chargement</h2>
        <p>{error}</p>
        <Button onClick={fetchReservations}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="my-reservations-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Mes Réservations</h1>
          <p className="page-description">
            Gérez vos formations réservées et suivez leur statut
          </p>
        </div>

        {reservations.length === 0 ? (
          <div className="no-reservations">
            <div className="no-reservations-icon">📅</div>
            <h3>Aucune réservation</h3>
            <p>
              Vous n'avez pas encore réservé de formation. 
              Explorez notre catalogue pour découvrir nos offres.
            </p>
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/formations'}
              icon={<i className="fas fa-search"></i>}
            >
              Découvrir les formations
            </Button>
          </div>
        ) : (
          <div className="reservations-section">
            <div className="reservations-stats">
              <div className="stat-card">
                <div className="stat-icon active">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <span className="stat-number">
                    {reservations.filter(r => r.statut === 'active').length}
                  </span>
                  <span className="stat-label">Confirmées</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon cancelled">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div className="stat-content">
                  <span className="stat-number">
                    {reservations.filter(r => r.statut === 'annulée').length}
                  </span>
                  <span className="stat-label">Annulées</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon completed">
                  <i className="fas fa-flag-checkered"></i>
                </div>
                <div className="stat-content">
                  <span className="stat-number">
                    {reservations.filter(r => r.statut === 'terminée').length}
                  </span>
                  <span className="stat-label">Terminées</span>
                </div>
              </div>
            </div>

            <div className="reservations-list">
              {reservations.map((reservation) => {
                const statusInfo = getStatusIcon(reservation.statut);
                return (
                  <div key={reservation._id} className="reservation-card">
                    <div className="card-header">
                      <div className="formation-info">
                        <h3 className="formation-title">
                          {reservation.formationId?.titre || 'Formation supprimée'}
                        </h3>
                        <div className="formation-meta">
                          <span className="meta-item">
                            <i className="fas fa-calendar"></i>
                            Réservé le {new Date(reservation.dateReservation).toLocaleDateString('fr-FR')}
                          </span>
                          {reservation.formationId && (
                            <span className="meta-item">
                              <i className="fas fa-euro-sign"></i>
                              {reservation.formationId.prix}€
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`status-badge ${statusInfo.class}`}>
                        <i className={statusInfo.icon}></i>
                        <span>{getStatusLabel(reservation.statut)}</span>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      {reservation.formationId && (
                        <>
                          <p className="formation-description">
                            {reservation.formationId.description.substring(0, 150)}...
                          </p>
                          
                          <div className="formation-details">
                            <div className="detail-item">
                              <i className="fas fa-clock"></i>
                              <span>{reservation.formationId.duree} heures</span>
                            </div>
                            <div className="detail-item">
                              <i className="fas fa-tag"></i>
                              <span>{reservation.formationId.categorie}</span>
                            </div>
                            <div className="detail-item">
                              <i className="fas fa-calendar-alt"></i>
                              <span>
                                {reservation.formationId.dateDebut 
                                  ? `Début: ${new Date(reservation.formationId.dateDebut).toLocaleDateString('fr-FR')}`
                                  : 'Date à définir'
                                }
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="reservation-details">
                        <h4>Informations de réservation</h4>
                        <div className="details-grid">
                          <div className="detail">
                            <span className="label">Nom :</span>
                            <span className="value">{reservation.nom}</span>
                          </div>
                          <div className="detail">
                            <span className="label">Prénom :</span>
                            <span className="value">{reservation.prenom}</span>
                          </div>
                          <div className="detail">
                            <span className="label">Email :</span>
                            <span className="value">{reservation.email}</span>
                          </div>
                          <div className="detail">
                            <span className="label">Téléphone :</span>
                            <span className="value">{reservation.telephone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      {reservation.formationId && (
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = `/formations/${reservation.formationId._id}`}
                          icon={<i className="fas fa-eye"></i>}
                        >
                          Voir la formation
                        </Button>
                      )}
                      
                      {canCancelReservation(reservation) && (
                        <Button
                          variant="error"
                          onClick={() => handleCancelReservation(reservation._id)}
                          loading={cancellingId === reservation._id}
                          icon={<i className="fas fa-times"></i>}
                        >
                          Annuler
                        </Button>
                      )}
                      
                      {reservation.statut === 'terminée' && (
                        <Button
                          variant="success"
                          onClick={() => window.location.href = `/formations/${reservation.formationId._id}#comments`}
                          icon={<i className="fas fa-star"></i>}
                        >
                          Laisser un avis
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservations;
