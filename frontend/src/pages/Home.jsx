import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import '../styles/Home.css';

const Home = () => {
  const { user } = useContext(AuthContext);

  const features = [
    {
      icon: '🎯',
      title: 'Formations Ciblées',
      description: 'Des formations spécialement conçues pour répondre aux besoins du marché actuel'
    },
    {
      icon: '👥',
      title: 'Experts Qualifiés',
      description: 'Apprenez auprès de professionnels expérimentés dans leur domaine'
    },
    {
      icon: '📅',
      title: 'Flexibilité',
      description: 'Choisissez vos dates et réservez en quelques clics seulement'
    },
    {
      icon: '🏆',
      title: 'Certification',
      description: 'Obtenez des certifications reconnues pour valoriser votre profil'
    }
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Développeuse Web',
      text: 'Les formations sont excellentes ! J\'ai pu acquérir de nouvelles compétences rapidement.',
      avatar: '👩‍💻'
    },
    {
      name: 'Pierre Martin',
      role: 'Chef de Projet',
      text: 'Interface intuitive et contenu de qualité. Je recommande vivement cette plateforme.',
      avatar: '👨‍💼'
    },
    {
      name: 'Sophie Laurent',
      role: 'Designer UX',
      text: 'Parfait pour se former en continu. Les instructeurs sont très compétents.',
      avatar: '👩‍🎨'
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Développez vos <span className="highlight">compétences</span>
              <br />avec nos formations professionnelles
            </h1>
            <p className="hero-description">
              Découvrez notre large gamme de formations dispensées par des experts. 
              Réservez facilement et boostez votre carrière dès aujourd'hui.
            </p>
            
            <div className="hero-actions">
              <Link to="/formations">
                <Button 
                  variant="primary" 
                  size="large"
                  icon={<i className="fas fa-search"></i>}
                >
                  Découvrir les formations
                </Button>
              </Link>
              
              {!user && (
                <Link to="/register">
                  <Button 
                    variant="outline" 
                    size="large"
                    icon={<i className="fas fa-user-plus"></i>}
                  >
                    Créer un compte
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Formations</span>
              </div>
              <div className="stat">
                <span className="stat-number">10k+</span>
                <span className="stat-label">Étudiants</span>
              </div>
              <div className="stat">
                <span className="stat-number">95%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
            </div>
          </div>
          
          <div className="hero-image">
            <div className="floating-card card-1">
              <div className="card-icon">📚</div>
              <div className="card-text">Formation React</div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">💼</div>
              <div className="card-text">Management</div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">🎨</div>
              <div className="card-text">Design UX/UI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Pourquoi choisir FormationPro ?</h2>
            <p className="section-description">
              Nous nous engageons à vous fournir la meilleure expérience d'apprentissage
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Prêt à commencer votre apprentissage ?</h2>
            <p className="cta-description">
              Rejoignez des milliers de professionnels qui ont déjà boosté leur carrière
            </p>
            <Link to="/formations">
              <Button 
                variant="primary" 
                size="large"
                icon={<i className="fas fa-rocket"></i>}
              >
                Voir toutes les formations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Ce que disent nos étudiants</h2>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="testimonial-content">
                  <p className="testimonial-text">"{testimonial.text}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <h4 className="author-name">{testimonial.name}</h4>
                    <p className="author-role">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
