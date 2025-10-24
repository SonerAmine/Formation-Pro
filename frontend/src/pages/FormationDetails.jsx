import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { api } from '../services/api';
import { debugFormationId, debugApiResponse, debugFormationStructure } from '../utils/debugFormationDetails';
import '../styles/FormationDetails.css';

const FormationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [formation, setFormation] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userHasReservation, setUserHasReservation] = useState(false);
  const [checkingReservation, setCheckingReservation] = useState(false);

  const [reservationData, setReservationData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || ''
  });

  const fetchFormationDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Debug: Log l'ID que nous essayons de récupérer
      debugFormationId(id);
      
      const response = await api.get(`/formations/${id}`);
      
      // Debug: Log la réponse de l'API
      debugApiResponse(response, 'Formation Details');
      
      // Extraire les données de la formation de la réponse API
      const formationData = response.data?.data || response.data;
      
      if (formationData) {
        // Debug: Log la structure de la formation
        debugFormationStructure(formationData);
        
        setFormation(formationData);
        setError(''); // Clear any previous errors
        console.log('✅ Formation loaded successfully:', formationData.titre);
      } else {
        console.warn('⚠️ No formation data found in response');
        setError('Formation non trouvée');
      }
    } catch (err) {
      console.error('❌ Error fetching formation:', err);
      console.error('❌ Response received:', err.response?.data);
      
      if (err.response?.status === 404) {
        setError('Formation non trouvée - ID invalide');
      } else if (err.response?.status === 500) {
        setError('Erreur serveur - Veuillez réessayer');
      } else {
        setError('Erreur lors du chargement de la formation');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/comments/formation/${id}`);
      // Extraire les données des commentaires
      const commentsData = response.data?.data || response.data || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]); // Set empty array on error
    }
  }, [id]);

  const checkUserReservation = useCallback(async () => {
    if (!user || !id) {
      setUserHasReservation(false);
      return;
    }

    try {
      setCheckingReservation(true);
      const response = await api.get('/reservations/my');
      const reservations = response.data?.data || [];
      
      // Vérifier si l'utilisateur a une réservation active ou terminée pour cette formation
      const hasReservation = reservations.some(reservation => 
        reservation.formationId._id === id && 
        (reservation.statut === 'active' || reservation.statut === 'terminee')
      );
      
      setUserHasReservation(hasReservation);
    } catch (err) {
      console.error('Error checking user reservation:', err);
      setUserHasReservation(false);
    } finally {
      setCheckingReservation(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (id) {
      console.log('Fetching formation with ID:', id);
      fetchFormationDetails();
      fetchComments();
    } else {
      console.error('No formation ID found in URL');
      setError('ID de formation manquant');
      setLoading(false);
    }
  }, [id, fetchFormationDetails, fetchComments]);

  // Separate effect to check reservation status when user changes
  useEffect(() => {
    checkUserReservation();
  }, [user, checkUserReservation]);

  const handleReservation = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Vous devez être connecté pour réserver');
      navigate('/login');
      return;
    }

    try {
      setIsReserving(true);
      await api.post(`/reservations`, {
        formationId: id,
        ...reservationData
      });
      
      // Afficher message de succès avec animation
      setShowReservationForm(false);
      
      // Petit délai pour permettre à la modal de se fermer avant la redirection
      setTimeout(() => {
        alert('🎉 Félicitations ! Votre réservation a été confirmée avec succès.\n\nVous recevrez un email de confirmation sous peu.\n\nVous allez être redirigé vers vos réservations.');
        
        // Refresh des données
        fetchFormationDetails(); // Refresh to update remaining places
        checkUserReservation(); // Refresh reservation status to enable commenting
        
        // Redirection après un court délai
        setTimeout(() => {
          navigate('/my-reservations');
        }, 1000);
      }, 300);
    } catch (err) {
      console.error('Error making reservation:', err);
      
      // Gestion d'erreurs plus professionnelle
      let errorMessage = 'Une erreur est survenue lors de la réservation.';
      
      if (err.response?.status === 400) {
        if (err.response.data?.error?.includes('déjà réservé')) {
          errorMessage = '⚠️ Vous avez déjà réservé cette formation.\n\nConsultez vos réservations pour plus de détails.';
        } else if (err.response.data?.error?.includes('Aucune place')) {
          errorMessage = '😔 Désolé, il n\'y a plus de places disponibles pour cette formation.\n\nVeuillez choisir une autre formation ou vous inscrire sur liste d\'attente.';
        } else if (err.response.data?.message) {
          errorMessage = `⚠️ ${err.response.data.message}`;
        } else if (err.response.data?.error) {
          errorMessage = `⚠️ ${err.response.data.error}`;
        }
      } else if (err.response?.status === 401) {
        errorMessage = '🔐 Votre session a expiré.\n\nVeuillez vous reconnecter pour continuer.';
        // Rediriger vers la page de connexion
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status >= 500) {
        errorMessage = '🔧 Problème technique temporaire.\n\nVeuillez réessayer dans quelques instants ou contacter le support.';
      }
      
      alert(errorMessage);
    } finally {
      setIsReserving(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Vous devez être connecté pour commenter');
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      alert('Veuillez saisir un commentaire');
      return;
    }

    try {
      setIsSubmittingComment(true);
      await api.post('/comments', {
        formationId: id,
        contenu: newComment
      });
      
      setNewComment('');
      fetchComments(); // Refresh comments
      checkUserReservation(); // Refresh reservation status
      alert('Commentaire ajouté avec succès !');
    } catch (err) {
      console.error('Error adding comment:', err);
      
      if (err.response?.status === 403) {
        // L'utilisateur n'a pas les droits pour commenter (n'a pas réservé)
        alert('Vous devez avoir réservé cette formation pour pouvoir commenter.');
      } else if (err.response?.status === 400 && err.response?.data?.error?.includes('déjà commenté')) {
        alert('Vous avez déjà commenté cette formation.');
      } else if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert('Erreur lors de l\'ajout du commentaire');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const addToFavorites = async () => {
    if (!user) {
      alert('Vous devez être connecté pour ajouter aux favoris');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/users/favorites/${id}`);
      alert('Formation ajoutée aux favoris !');
    } catch (err) {
      console.error('Error adding to favorites:', err);
      alert('Erreur lors de l\'ajout aux favoris');
    }
  };

  const isExpired = () => {
    // Plus de date limite, on vérifie si la formation a déjà commencé
    return formation && formation.dateDebut && new Date(formation.dateDebut) < new Date();
  };

  const isFull = () => {
    return formation && formation.placesRestantes <= 0;
  };

  const canReserve = () => {
    return user && !isExpired() && !isFull();
  };

  if (loading) {
    return (
      <div className="formation-details-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la formation...</p>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="formation-details-error">
        <div className="error-icon">⚠️</div>
        <h2>Formation non trouvée</h2>
        <p>{error}</p>
        <Button onClick={() => navigate('/formations')}>
          Retour aux formations
        </Button>
      </div>
    );
  }

  return (
    <div className="formation-details-page">
      <div className="container">
        {/* Header */}
        <div className="formation-header">
          <div className="breadcrumb">
            <Button 
              variant="link" 
              onClick={() => navigate('/formations')}
              icon={<i className="fas fa-arrow-left"></i>}
            >
              Retour aux formations
            </Button>
          </div>
          
          <div className="formation-hero">
            <div className="formation-info">
              <div className="category-badge">{formation.categorie}</div>
              <h1 className="formation-title">{formation.titre}</h1>
              <p className="formation-description">{formation.description}</p>
              
              <div className="formation-meta">
                <div className="meta-item">
                  <i className="fas fa-clock"></i>
                  <span>{formation.duree} heures</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-users"></i>
                  <span>{formation.placesTotales} places (dont {formation.placesRestantes} restantes)</span>
                </div>
                <div className="meta-item">
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
                <span className="price-label">Prix :</span>
                <span className="price">{formation.prix}€</span>
              </div>
            </div>
            
            <div className="formation-actions">
              <div className="actions-card">
                {isExpired() ? (
                  <div className="status-message expired">
                    <i className="fas fa-times-circle"></i>
                    <span>Inscription fermée</span>
                  </div>
                ) : isFull() ? (
                  <div className="status-message full">
                    <i className="fas fa-users"></i>
                    <span>Formation complète</span>
                  </div>
                ) : (
                  <div className="status-message available">
                    <i className="fas fa-check-circle"></i>
                    <span>Places disponibles</span>
                  </div>
                )}
                
                <div className="action-buttons">
                  {canReserve() && (
                    <Button
                      variant="primary"
                      size="large"
                      fullWidth
                      onClick={() => setShowReservationForm(true)}
                      icon={<i className="fas fa-calendar-plus"></i>}
                    >
                      Réserver maintenant
                    </Button>
                  )}
                  
                  {user && (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={addToFavorites}
                      icon={<i className="far fa-heart"></i>}
                    >
                      Ajouter aux favoris
                    </Button>
                  )}
                  
                  {!user && (
                    <Button
                      variant="primary"
                      size="large"
                      fullWidth
                      onClick={() => navigate('/login')}
                      icon={<i className="fas fa-sign-in-alt"></i>}
                    >
                      Se connecter pour réserver
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="formation-content">
          <div className="content-section">
            <h2>Description détaillée</h2>
            <div className="content-text">
              <p>{formation.descriptionComplete || formation.description}</p>
            </div>
          </div>
          
          <div className="content-section">
            <h2>Ce que vous allez apprendre</h2>
            <ul className="learning-objectives">
              <li>Maîtriser les concepts fondamentaux</li>
              <li>Appliquer les bonnes pratiques du domaine</li>
              <li>Développer des projets concrets</li>
              <li>Obtenir une certification reconnue</li>
            </ul>
          </div>
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h2>Avis et commentaires ({comments.length})</h2>
          
          {/* Message pour les visiteurs non connectés */}
          {!user && (
            <div className="comment-form-message">
              <div className="message-card info">
                <i className="fas fa-info-circle"></i>
                <div className="message-content">
                  <h4>Vous souhaitez donner votre avis ?</h4>
                  <p>Vous devez créer un compte ou vous connecter pour pouvoir commenter cette formation.</p>
                  <div className="message-actions">
                    <Button onClick={() => navigate('/login')}>
                      Se connecter
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/register')}>
                      Créer un compte
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Message pour les utilisateurs connectés sans réservation */}
          {user && !userHasReservation && !checkingReservation && (
            <div className="comment-form-message">
              <div className="message-card warning">
                <i className="fas fa-exclamation-triangle"></i>
                <div className="message-content">
                  <h4>Réservez d'abord cette formation</h4>
                  <p>Vous devez avoir réservé cette formation pour pouvoir laisser un commentaire et partager votre expérience.</p>
                  <div className="message-actions">
                    {canReserve() && (
                      <Button onClick={() => setShowReservationForm(true)}>
                        Réserver maintenant
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Formulaire de commentaire pour les utilisateurs avec réservation */}
          {user && userHasReservation && (
            <form onSubmit={handleAddComment} className="comment-form">
              <FormInput
                type="textarea"
                placeholder="Partagez votre avis sur cette formation..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
              <Button
                type="submit"
                loading={isSubmittingComment}
                icon={<i className="fas fa-paper-plane"></i>}
              >
                Publier le commentaire
              </Button>
            </form>
          )}
          
          {/* Loading state pour la vérification de réservation */}
          {checkingReservation && (
            <div className="comment-form-message">
              <div className="loading-message">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Vérification de votre éligibilité...</span>
              </div>
            </div>
          )}
          
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">
                <p>Aucun commentaire pour le moment. Soyez le premier à donner votre avis !</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="comment-card">
                  <div className="comment-header">
                    <div className="comment-author">
                      <div className="author-avatar">
                        {comment.userId?.prenom?.charAt(0) || '?'}
                      </div>
                      <div className="author-info">
                        <h4>{comment.userId?.prenom} {comment.userId?.nom}</h4>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="comment-content">
                    <p>{comment.contenu}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationForm && (
        <div className="modal-overlay" onClick={() => setShowReservationForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Réserver cette formation</h3>
              <button
                className="modal-close"
                onClick={() => setShowReservationForm(false)}
                title="Fermer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleReservation} className="reservation-form">
              <div className="form-section">
                <h4>
                  <i className="fas fa-user"></i>
                  Informations personnelles
                </h4>
                <div className="form-row">
                  <FormInput
                    label="Nom *"
                    name="nom"
                    value={reservationData.nom}
                    onChange={(e) => setReservationData({...reservationData, nom: e.target.value})}
                    required
                    placeholder="Votre nom de famille"
                  />
                  <FormInput
                    label="Prénom *"
                    name="prenom"
                    value={reservationData.prenom}
                    onChange={(e) => setReservationData({...reservationData, prenom: e.target.value})}
                    required
                    placeholder="Votre prénom"
                  />
                </div>
                
                <FormInput
                  label="Adresse email *"
                  type="email"
                  name="email"
                  value={reservationData.email}
                  onChange={(e) => setReservationData({...reservationData, email: e.target.value})}
                  required
                  placeholder="votre@email.com"
                  icon={<i className="fas fa-envelope"></i>}
                />
                
                <FormInput
                  label="Numéro de téléphone *"
                  type="tel"
                  name="telephone"
                  value={reservationData.telephone}
                  onChange={(e) => setReservationData({...reservationData, telephone: e.target.value})}
                  required
                  placeholder="06 00 00 00 00"
                  icon={<i className="fas fa-phone"></i>}
                />
              </div>
              
              <div className="reservation-summary">
                <h4>Récapitulatif de votre réservation</h4>
                <div className="summary-item">
                  <span>
                    <i className="fas fa-graduation-cap"></i>
                    Formation
                  </span>
                  <span>{formation.titre}</span>
                </div>
                <div className="summary-item">
                  <span>
                    <i className="fas fa-clock"></i>
                    Durée
                  </span>
                  <span>{formation.duree} heures</span>
                </div>
                <div className="summary-item">
                  <span>
                    <i className="fas fa-calendar"></i>
                    Début prévu
                  </span>
                  <span>
                    {formation.dateDebut 
                      ? new Date(formation.dateDebut).toLocaleDateString('fr-FR')
                      : 'À définir'
                    }
                  </span>
                </div>
                <div className="summary-item total">
                  <span>
                    <i className="fas fa-euro-sign"></i>
                    Prix total
                  </span>
                  <span>{formation.prix}€</span>
                </div>
                <div className="summary-note">
                  <i className="fas fa-info-circle"></i>
                  <small>Vous recevrez une confirmation par email après votre réservation.</small>
                </div>
              </div>
              
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReservationForm(false)}
                  disabled={isReserving}
                >
                  <i className="fas fa-times"></i>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isReserving}
                  disabled={isReserving}
                  icon={<i className="fas fa-credit-card"></i>}
                >
                  {isReserving ? 'Traitement...' : 'Confirmer ma réservation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationDetails;
