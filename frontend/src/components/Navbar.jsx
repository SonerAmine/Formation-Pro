import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Debug: Afficher les infos de l'utilisateur
  React.useEffect(() => {
    if (user) {
      console.log('👤 User dans Navbar:', { 
        nom: user.nom, 
        prenom: user.prenom, 
        role: user.role,
        isAdmin: isAdmin()
      });
    }
  }, [user, isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={() => setIsMenuOpen(false)}>
          <span className="logo-icon">🎓</span>
          FormationPro
        </Link>
        
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Accueil
          </Link>
          <Link to="/formations" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Formations
          </Link>
          
          {user ? (
            <>
              <Link to="/favorites" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Favoris
              </Link>
              <Link to="/my-reservations" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Mes Réservations
              </Link>
              <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <i className="fas fa-user-circle"></i> Mon Profil
              </Link>
              {user.role === 'admin' && (
                <Link 
                  to="/dashboard" 
                  className="nav-link admin-link" 
                  onClick={() => setIsMenuOpen(false)}
                  style={{ 
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    color: 'white',
                    fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>⚡</span>
                  Dashboard Admin
                </Link>
              )}
              <div className="nav-user">
                <span className="user-welcome">Bonjour, {user.prenom}</span>
                <button className="logout-btn" onClick={handleLogout}>
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="nav-link login-link" onClick={() => setIsMenuOpen(false)}>
                Connexion
              </Link>
              <Link to="/register" className="nav-link register-link" onClick={() => setIsMenuOpen(false)}>
                Inscription
              </Link>
            </div>
          )}
        </div>
        
        <div className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
