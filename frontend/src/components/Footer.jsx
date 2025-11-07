import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">
              <span className="logo-icon">🎓</span>
              FormationPro
            </h3>
            <p className="footer-description">
              Votre plateforme de référence pour des formations professionnelles de qualité.
              Développez vos compétences avec nos experts.
            </p>
            <div className="social-links">
              <button className="social-link" aria-label="Facebook" onClick={() => window.open('https://facebook.com', '_blank')}>
                <i className="fab fa-facebook-f"></i>
              </button>
              <button className="social-link" aria-label="Twitter" onClick={() => window.open('https://twitter.com', '_blank')}>
                <i className="fab fa-twitter"></i>
              </button>
              <button className="social-link" aria-label="LinkedIn" onClick={() => window.open('https://linkedin.com', '_blank')}>
                <i className="fab fa-linkedin-in"></i>
              </button>
              <button className="social-link" aria-label="Instagram" onClick={() => window.open('https://instagram.com', '_blank')}>
                <i className="fab fa-instagram"></i>
              </button>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="section-title">Formations</h4>
            <ul className="footer-links">
              <li><a href="/formations">Toutes les formations</a></li>
              <li><a href="/formations?category=tech">Technologies</a></li>
              <li><a href="/formations?category=business">Business</a></li>
              <li><a href="/formations?category=design">Design</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="section-title">Support</h4>
            <ul className="footer-links">
              <li><a href="/help">Centre d'aide</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/terms">Conditions d'utilisation</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="section-title">Contact</h4>
            <div className="contact-info">
              <p><i className="fas fa-envelope"></i> contact@formationpro.com</p>
              <p><i className="fas fa-phone"></i> +33 1 23 45 67 89</p>
              <p><i className="fas fa-map-marker-alt"></i> Paris, France</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2024 FormationPro. Tous droits réservés.</p>
            <div className="footer-bottom-links">
              <a href="/privacy">Politique de confidentialité</a>
              <a href="/cookies">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
