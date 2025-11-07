import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Veuillez fournir un email valide");
      return;
    }

    try {
      setLoading(true);
      const res = await (await import('../services/api')).authAPI.forgotPassword(email);
      if (res.status === 200) {
        setMessage("Si un compte existe pour cet email, un message a été envoyé.");
      }
    } catch (err) {
      setMessage("Si un compte existe pour cet email, un message a été envoyé.");
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
            <h2 className="auth-title">Mot de passe oublié</h2>
            <p className="auth-subtitle">Recevez un lien sécurisé par email</p>
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
              label="Adresse email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              icon={<i className="fas fa-envelope"></i>}
              required
            />

            <Button type="submit" variant="primary" size="large" fullWidth loading={loading}>
              Envoyer le lien
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
              <h3>Récupérez votre accès</h3>
              <p>Nous vous enverrons un lien de réinitialisation valable 10 minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


