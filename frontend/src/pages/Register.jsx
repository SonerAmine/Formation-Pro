import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import '../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmMotDePasse: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    } else if (formData.nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    } else if (formData.prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    if (!formData.telephone) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (!/^[0-9+\-\s]{10,}$/.test(formData.telephone)) {
      newErrors.telephone = 'Le numéro de téléphone n\'est pas valide';
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    } else if (formData.motDePasse.length < 6) {
      newErrors.motDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.motDePasse)) {
      newErrors.motDePasse = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!formData.confirmMotDePasse) {
      newErrors.confirmMotDePasse = 'La confirmation du mot de passe est requise';
    } else if (formData.motDePasse !== formData.confirmMotDePasse) {
      newErrors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'Vous devez accepter les conditions d\'utilisation';
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
      const { confirmMotDePasse, ...userData } = formData;
      await register(userData);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors({
        general: err.response?.data?.error || err.response?.data?.message || 'Erreur lors de l\'inscription'
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
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Google registration error:', err);
      setErrors({
        general: err.response?.data?.error || 'Erreur lors de l\'inscription avec Google'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrors({
      general: 'L\'inscription Google a échoué. Veuillez réessayer.'
    });
  };

  const getPasswordStrength = () => {
    const password = formData.motDePasse;
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength <= 2) return { label: 'Faible', class: 'weak' };
    if (strength <= 4) return { label: 'Moyen', class: 'medium' };
    return { label: 'Fort', class: 'strong' };
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
            <h2 className="auth-title">Créer un compte</h2>
            <p className="auth-subtitle">
              Rejoignez notre communauté et accédez à nos formations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                <i className="fas fa-exclamation-triangle"></i>
                {errors.general}
              </div>
            )}

            <div className="form-row">
              <FormInput
                label="Nom"
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Votre nom"
                error={errors.nom}
                icon={<i className="fas fa-user"></i>}
                required
              />
              <FormInput
                label="Prénom"
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Votre prénom"
                error={errors.prenom}
                icon={<i className="fas fa-user"></i>}
                required
              />
            </div>

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
              label="Numéro de téléphone"
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="+33 1 23 45 67 89"
              error={errors.telephone}
              icon={<i className="fas fa-phone"></i>}
              required
            />

            <div className="password-field">
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
              {formData.motDePasse && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div
                        key={i}
                        className={`strength-bar ${i <= getPasswordStrength() ? 'active' : ''} ${getPasswordStrengthLabel().class}`}
                      ></div>
                    ))}
                  </div>
                  <span className={`strength-label ${getPasswordStrengthLabel().class}`}>
                    {getPasswordStrengthLabel().label}
                  </span>
                </div>
              )}
            </div>

            <FormInput
              label="Confirmer le mot de passe"
              type="password"
              name="confirmMotDePasse"
              value={formData.confirmMotDePasse}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              error={errors.confirmMotDePasse}
              icon={<i className="fas fa-lock"></i>}
              required
            />

            <div className="terms-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="terms-text">
                  J'accepte les{' '}
                  <Link to="/terms" target="_blank" className="terms-link">
                    conditions d'utilisation
                  </Link>
                  {' '}et la{' '}
                  <Link to="/privacy" target="_blank" className="terms-link">
                    politique de confidentialité
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.terms}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              icon={<i className="fas fa-user-plus"></i>}
            >
              Créer mon compte
            </Button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <div className="social-login">
            <p className="social-login-hint">
              <i className="fas fa-rocket"></i>
              Inscription rapide et sécurisée avec votre compte Google
            </p>
            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                logo_alignment="left"
                width="100%"
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-footer">
            <p>
              Vous avez déjà un compte ?{' '}
              <Link 
                to="/login" 
                className="auth-link"
                style={{
                  position: 'relative',
                  zIndex: 100,
                  display: 'inline-block',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                Se connecter
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
              <h3>Rejoignez FormationPro</h3>
              <p>
                Créez votre compte pour accéder à nos formations exclusives 
                et développer vos compétences professionnelles.
              </p>
              
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">🎯</div>
                  <div className="benefit-text">
                    <h4>Formations ciblées</h4>
                    <p>Adaptées à vos besoins</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">📅</div>
                  <div className="benefit-text">
                    <h4>Réservation facile</h4>
                    <p>En quelques clics</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🏆</div>
                  <div className="benefit-text">
                    <h4>Certifications</h4>
                    <p>Reconnues sur le marché</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
