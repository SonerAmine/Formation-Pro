import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { api } from '../services/api';
import '../styles/FormationList.css';

const FormationList = () => {
  const [formations, setFormations] = useState([]);
  const [filteredFormations, setFilteredFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useContext(AuthContext);

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'tech', label: 'Technologies' },
    { value: 'business', label: 'Business' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'management', label: 'Management' }
  ];

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/formations');
      // S'assurer que nous avons un tableau
      const formationsData = response.data?.data || [];
      setFormations(Array.isArray(formationsData) ? formationsData : []);
    } catch (err) {
      console.error('Error fetching formations:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors du chargement des formations';
      setError(errorMessage);
      // S'assurer que les formations restent un tableau vide en cas d'erreur
      setFormations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFormations = useCallback(() => {
    let filtered = [...formations];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(formation =>
        formation.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(formation => formation.categorie === selectedCategory);
    }

    // Sort formations
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.prix - b.prix);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.prix - a.prix);
        break;
      case 'name-az':
        filtered.sort((a, b) => a.titre.localeCompare(b.titre));
        break;
      case 'name-za':
        filtered.sort((a, b) => b.titre.localeCompare(a.titre));
        break;
      default:
        break;
    }

    setFilteredFormations(filtered);
  }, [formations, searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    fetchFormations();
  }, []);

  useEffect(() => {
    filterAndSortFormations();
  }, [filterAndSortFormations]);

  const addToFavorites = async (formationId) => {
    if (!user) {
      alert('Vous devez être connecté pour ajouter aux favoris');
      return;
    }

    try {
      await api.post(`/users/favorites/${formationId}`);
      alert('Formation ajoutée aux favoris !');
    } catch (err) {
      console.error('Error adding to favorites:', err);
      alert('Erreur lors de l\'ajout aux favoris');
    }
  };

  const isExpired = (dateDebut) => {
    // Plus de date limite, on vérifie si la formation a déjà commencé
    return dateDebut ? new Date(dateDebut) < new Date() : false;
  };

  const isFull = (placesRestantes) => {
    return placesRestantes <= 0;
  };

  if (loading) {
    return (
      <div className="formations-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des formations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="formations-error">
        <div className="error-icon">⚠️</div>
        <h2>Oops ! Une erreur est survenue</h2>
        <p>{error}</p>
        <Button onClick={fetchFormations}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="formations-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Nos Formations</h1>
          <p className="page-description">
            Découvrez notre catalogue de formations professionnelles
          </p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="search-filter">
              <FormInput
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<i className="fas fa-search"></i>}
              />
            </div>
            
            <div className="category-filter">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sort-filter">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Plus récentes</option>
                <option value="oldest">Plus anciennes</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="name-az">Nom A-Z</option>
                <option value="name-za">Nom Z-A</option>
              </select>
            </div>
          </div>
          
          <div className="results-count">
            {filteredFormations.length} formation(s) trouvée(s)
          </div>
        </div>

        {/* Formations Grid */}
        {filteredFormations.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>Aucune formation trouvée</h3>
            <p>Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="formations-grid">
            {filteredFormations.map((formation) => (
              <div key={formation._id} className="formation-card">
                <div className="card-header">
                  <div className="card-image">
                    <div className="category-badge">{formation.categorie}</div>
                    {user && (
                      <button
                        className="favorite-btn"
                        onClick={() => addToFavorites(formation._id)}
                        aria-label="Ajouter aux favoris"
                      >
                        <i className="far fa-heart"></i>
                      </button>
                    )}
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
                  {isExpired(formation.dateDebut) ? (
                    <Button variant="disabled" fullWidth disabled>
                      <i className="fas fa-times"></i>
                      Formation terminée
                    </Button>
                  ) : isFull(formation.placesRestantes) ? (
                    <Button variant="disabled" fullWidth disabled>
                      <i className="fas fa-users"></i>
                      Complet
                    </Button>
                  ) : (
                    <Link to={`/formations/${formation._id}`}>
                      <Button variant="primary" fullWidth>
                        <i className="fas fa-eye"></i>
                        Voir détails
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormationList;
