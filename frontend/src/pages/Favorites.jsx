import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { api } from '../services/api';
import '../styles/Favorites.css';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/favorites');
      // S'assurer que nous avons un tableau
      const favoritesData = response.data?.data || [];
      setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors du chargement des favoris';
      setError(errorMessage);
      // S'assurer que les favoris restent un tableau vide en cas d'erreur
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (formationId) => {
    try {
      setRemovingId(formationId);
      await api.delete(`/users/favorites/${formationId}`);
      
      // Update local state
      setFavorites(prev => prev.filter(favorite => favorite._id !== formationId));
      
    } catch (err) {
      console.error('Error removing from favorites:', err);
      alert('Erreur lors de la suppression du favori');
    } finally {
      setRemovingId(null);
    }
  };

  const isExpired = (dateDebut) => {
    // Plus de date limite, on vérifie si la formation a déjà commencé
    return dateDebut ? new Date(dateDebut) < new Date() : false;
  };

  const isFull = (placesRestantes) => {
    return placesRestantes <= 0;
  };

  const getAvailabilityStatus = (formation) => {
    if (isExpired(formation.dateDebut)) {
      return { status: 'expired', label: 'Formation terminée', class: 'status-expired' };
    }
    if (isFull(formation.placesRestantes)) {
      return { status: 'full', label: 'Complet', class: 'status-full' };
    }
    return { status: 'available', label: 'Disponible', class: 'status-available' };
  };

  if (loading) {
    return (
      <div className="favorites-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de vos favoris...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-error">
        <div className="error-icon">⚠️</div>
        <h2>Erreur de chargement</h2>
        <p>{error}</p>
        <Button onClick={fetchFavorites}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-heart"></i>
            Mes Favoris
          </h1>
          <p className="page-description">
            Retrouvez toutes vos formations favorites en un clin d'œil
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="no-favorites">
            <div className="no-favorites-icon">💝</div>
            <h3>Aucun favori</h3>
            <p>
              Vous n'avez pas encore ajouté de formation à vos favoris. 
              Parcourez notre catalogue et ajoutez vos formations préférées !
            </p>
            <Link to="/formations">
              <Button 
                variant="primary"
                icon={<i className="fas fa-search"></i>}
              >
                Explorer les formations
              </Button>
            </Link>
          </div>
        ) : (
          <div className="favorites-section">
            <div className="favorites-header">
              <div className="favorites-count">
                <span className="count-number">{favorites.length}</span>
                <span className="count-label">formation(s) favorite(s)</span>
              </div>
              
              <div className="favorites-actions">
                <Button
                  variant="outline"
                  onClick={fetchFavorites}
                  icon={<i className="fas fa-sync-alt"></i>}
                >
                  Actualiser
                </Button>
              </div>
            </div>

            <div className="favorites-grid">
              {favorites.map((formation) => {
                const availability = getAvailabilityStatus(formation);
                
                return (
                  <div key={formation._id} className="favorite-card">
                    <div className="card-header">
                      <div className="card-image">
                        <div className="category-badge">{formation.categorie}</div>
                        <div className={`availability-badge ${availability.class}`}>
                          {availability.label}
                        </div>
                        <button
                          className={`favorite-btn active ${removingId === formation._id ? 'removing' : ''}`}
                          onClick={() => handleRemoveFromFavorites(formation._id)}
                          disabled={removingId === formation._id}
                          aria-label="Retirer des favoris"
                        >
                          {removingId === formation._id ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-heart"></i>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <h3 className="formation-title">{formation.titre}</h3>
                      <p className="formation-description">
                        {formation.description.substring(0, 120)}...
                      </p>
                      
                      <div className="formation-details">
                        <div className="detail-item">
                          <i className="fas fa-clock"></i>
                          <span>{formation.duree} heures</span>
                        </div>
                        <div className="detail-item">
                          <i className="fas fa-users"></i>
                          <span>{formation.placesRestantes} places restantes</span>
                        </div>
                        <div className="detail-item">
                          <i className="fas fa-calendar"></i>
                          <span>
                            {formation.dateDebut 
                              ? `Début: ${new Date(formation.dateDebut).toLocaleDateString('fr-FR')}`
                              : 'Date à définir'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="formation-price">
                        <span className="price">{formation.prix}€</span>
                      </div>
                    </div>
                    
                    <div className="card-footer">
                      <div className="card-actions">
                        <Link to={`/formations/${formation._id}`}>
                          <Button 
                            variant="primary" 
                            fullWidth
                            icon={<i className="fas fa-eye"></i>}
                          >
                            Voir détails
                          </Button>
                        </Link>
                        
                        {availability.status === 'available' && (
                          <Link to={`/formations/${formation._id}`}>
                            <Button 
                              variant="success" 
                              fullWidth
                              icon={<i className="fas fa-calendar-plus"></i>}
                            >
                              Réserver
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="quick-actions-header">
                <h3>Actions rapides</h3>
              </div>
              
              <div className="quick-actions-grid">
                <div className="quick-action-card">
                  <div className="action-icon">
                    <i className="fas fa-filter"></i>
                  </div>
                  <div className="action-content">
                    <h4>Filtrer par disponibilité</h4>
                    <p>Voir uniquement les formations disponibles</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const availableFormations = favorites.filter(f => 
                        !isExpired(f.dateDebut) && !isFull(f.placesRestantes)
                      );
                      if (availableFormations.length === 0) {
                        alert('Aucune formation disponible dans vos favoris');
                      } else {
                        // You could implement filtering logic here
                        console.log('Available formations:', availableFormations);
                      }
                    }}
                  >
                    Filtrer
                  </Button>
                </div>
                
                <div className="quick-action-card">
                  <div className="action-icon">
                    <i className="fas fa-share"></i>
                  </div>
                  <div className="action-content">
                    <h4>Partager mes favoris</h4>
                    <p>Partager votre liste de favoris</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const shareText = `Découvrez mes formations favorites sur FormationPro ! ${favorites.length} formations sélectionnées.`;
                      if (navigator.share) {
                        navigator.share({
                          title: 'Mes formations favorites',
                          text: shareText,
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(shareText + ' ' + window.location.href);
                        alert('Lien copié dans le presse-papiers !');
                      }
                    }}
                  >
                    Partager
                  </Button>
                </div>
                
                <div className="quick-action-card">
                  <div className="action-icon">
                    <i className="fas fa-download"></i>
                  </div>
                  <div className="action-content">
                    <h4>Exporter la liste</h4>
                    <p>Télécharger vos favoris en PDF</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Implement PDF export functionality
                      alert('Fonctionnalité en cours de développement');
                    }}
                  >
                    Exporter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
