import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    } else if (formData.motDePasse.length < 6) {
      newErrors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.motDePasse);
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({
        general: err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la connexion'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      await loginWithGoogle(credentialResponse.credential, clientId);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google login error:', err);
      setErrors({
        general: err.response?.data?.error || 'Erreur lors de la connexion avec Google'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({
      general: 'La connexion Google a échoué. Veuillez réessayer.'
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-icon">🎓</span>
              <h1>FormationPro</h1>
            </div>
            <h2 className="auth-title">Connexion</h2>
            <p className="auth-subtitle">
              Connectez-vous pour accéder à votre espace personnel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                <i className="fas fa-exclamation-triangle"></i>
                {errors.general}
              </div>
            )}

            <FormInput
              label="Adresse email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre.email@exemple.com"
              error={errors.email}
              icon={<i className="fas fa-envelope"></i>}
              required
            />

            <FormInput
              label="Mot de passe"
              type="password"
              name="motDePasse"
              value={formData.motDePasse}
              onChange={handleChange}
              placeholder="Votre mot de passe"
              error={errors.motDePasse}
              icon={<i className="fas fa-lock"></i>}
              required
            />

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Se souvenir de moi
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              icon={<i className="fas fa-sign-in-alt"></i>}
            >
              Se connecter
            </Button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <div className="social-login">
            <p className="social-login-hint">
              <i className="fas fa-info-circle"></i>
              Pas de compte ? Utilisez Google pour créer un compte instantanément
            </p>
            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                logo_alignment="left"
                width="100%"
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-footer">
            <p>
              Vous n'avez pas encore de compte ?{' '}
              <Link 
                to="/register" 
                className="auth-link"
                style={{
                  position: 'relative',
                  zIndex: 100,
                  display: 'inline-block',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-visual">
          <div className="visual-content">
            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
            
            <div className="visual-text">
              <h3>Bienvenue sur FormationPro</h3>
              <p>
                Accédez à des centaines de formations professionnelles 
                et développez vos compétences avec nos experts.
              </p>
              
              <div className="features-list">
                <div className="feature-item">
                  <i className="fas fa-check"></i>
                  <span>Formations certifiantes</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check"></i>
                  <span>Experts reconnus</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check"></i>
                  <span>Réservation simplifiée</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
