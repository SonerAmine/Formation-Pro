import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import FormationList from './pages/FormationList';
import FormationDetails from './pages/FormationDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import MyReservations from './pages/MyReservations';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';

// Styles
import './styles/global.css';
import './styles/animations.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  return (
    <AuthContext.Consumer>
      {({ user, loading, isAdmin }) => {
        if (loading) {
          return (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement...</p>
            </div>
          );
        }

        if (!user) {
          return <Navigate to="/login" replace />;
        }

        if (adminOnly && !isAdmin()) {
          return <Navigate to="/" replace />;
        }

        return children;
      }}
    </AuthContext.Consumer>
  );
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  return (
    <AuthContext.Consumer>
      {({ user, loading }) => {
        if (loading) {
          return (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement...</p>
            </div>
          );
        }

        if (user) {
          return <Navigate to="/" replace />;
        }

        return children;
      }}
    </AuthContext.Consumer>
  );
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
              <Layout>
                <Home />
              </Layout>
              } />
              
              <Route path="/formations" element={
              <Layout>
                <FormationList />
              </Layout>
              } />
              
              <Route path="/formations/:id" element={
              <Layout>
                <FormationDetails />
              </Layout>
              } />

              {/* Auth Routes (only for non-authenticated users) */}
              <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
              } />
              
              <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
              } />

              <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
              } />

              <Route path="/reset-password" element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
              } />

              {/* Protected Routes (require authentication) */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <Layout>
                    <Favorites />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/my-reservations" element={
                <ProtectedRoute>
                  <Layout>
                    <MyReservations />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin Routes (require admin role) */}
              <Route path="/dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
              } />

              {/* 404 Route */}
              <Route path="*" element={
              <Layout>
                <div className="not-found-page">
                  <div className="container">
                    <div className="not-found-content">
                      <div className="not-found-icon">🔍</div>
                      <h1>Page non trouvée</h1>
                      <p>
                        La page que vous cherchez n'existe pas ou a été déplacée.
                      </p>
                      <a href="/" className="btn btn-primary">
                        <i className="fas fa-home"></i>
                        Retour à l'accueil
                      </a>
                    </div>
                  </div>
                </div>
              </Layout>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
