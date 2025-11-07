import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import '../styles/Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirm) {
      setError('La confirmation du mot de passe ne correspond pas');
      return;
    }

    try {
      setLoading(true);
      const { authAPI } = await import('../services/api');
      await authAPI.resetPassword(token, password);
      setMessage('Mot de passe réinitialisé avec succès. Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Le lien est invalide ou expiré.');
    } finally {
      setLoading(false);
    }
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
            <h2 className="auth-title">Nouveau mot de passe</h2>
            <p className="auth-subtitle">Choisissez un mot de passe sécurisé</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-banner">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            {message && (
              <div className="success-banner">
                <i className="fas fa-check-circle"></i>
                {message}
              </div>
            )}

            <FormInput
              label="Nouveau mot de passe"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre nouveau mot de passe"
              icon={<i className="fas fa-lock"></i>}
              required
            />

            <FormInput
              label="Confirmez le mot de passe"
              type="password"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              icon={<i className="fas fa-check"></i>}
              required
            />

            <Button type="submit" variant="primary" size="large" fullWidth loading={loading}>
              Réinitialiser
            </Button>

            <div className="form-footer-links">
              <Link to="/login" className="auth-link">Retour à la connexion</Link>
            </div>
          </form>
        </div>
        <div className="auth-visual">
          <div className="visual-content">
            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
            <div className="visual-text">
              <h3>Sécurité renforcée</h3>
              <p>Votre mot de passe est stocké chiffré et n’est jamais partagé.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


