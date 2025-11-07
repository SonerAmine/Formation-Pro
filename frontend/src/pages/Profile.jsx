import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { getAvatarUrl, handleImageError } from '../utils/imageUtils';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    genre: 'male' // male or female
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        genre: user.genre || 'male'
      });
      
      // Set image preview using utility function
      setImagePreview(getAvatarUrl(user.avatar, user.genre));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5MB' });
        return;
      }
      
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      // Créer FormData pour l'upload de fichier
      const formDataToSend = new FormData();
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('prenom', formData.prenom);
      formDataToSend.append('telephone', formData.telephone);
      formDataToSend.append('genre', formData.genre);
      
      // Ajouter le fichier s'il est sélectionné
      if (selectedFile) {
        formDataToSend.append('avatar', selectedFile);
      }
      
      // Update profile info
      const response = await authAPI.updateProfile(formDataToSend);
      
      if (response.data.success) {
        console.log('✅ Profile update response:', response.data.user);
        updateUser(response.data.user);
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
        setSelectedFile(null); // Reset selected file
        
        // Force re-render of image preview
        if (response.data.user.avatar) {
          setImagePreview(getAvatarUrl(response.data.user.avatar, response.data.user.genre));
        }
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erreur lors de la mise à jour' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatar = () => {
    return formData.genre === 'female' 
      ? '/photos/avatar-female-default.svg' 
      : '/photos/avatar-male-default.svg';
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-banner"></div>
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <img 
                src={imagePreview || getDefaultAvatar()} 
                alt="Profile" 
                className="profile-avatar"
                onError={(e) => handleImageError(e, formData.genre)}
              />
              <label className="avatar-upload-btn">
                <i className="fas fa-camera"></i>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div className="profile-header-info">
              <h1>{user?.prenom} {user?.nom}</h1>
              <p className="user-email">{user?.email}</p>
              <span className={`user-role ${user?.role}`}>
                {user?.role === 'admin' ? '👑 Administrateur' : '👤 Utilisateur'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-header-title">
            <h2>
              <i className="fas fa-user-edit"></i>
              Mes Informations
            </h2>
            <p className="profile-subtitle">Gérez vos informations personnelles</p>
          </div>

          {message.text && (
            <div className={`profile-message ${message.type}`}>
              <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <h3>Informations de base</h3>
                <div className="form-row">
                  <FormInput
                    label="Prénom"
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    icon={<i className="fas fa-user"></i>}
                    required
                  />
                  <FormInput
                    label="Nom"
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    icon={<i className="fas fa-user"></i>}
                    required
                  />
                </div>

                <div className="form-row">
                  <FormInput
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    icon={<i className="fas fa-envelope"></i>}
                    disabled
                    required
                  />
                  <FormInput
                    label="Téléphone"
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    icon={<i className="fas fa-phone"></i>}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-venus-mars"></i>
                    Genre
                  </label>
                  <div className="gender-selector">
                    <label className={`gender-option ${formData.genre === 'male' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="genre"
                        value="male"
                        checked={formData.genre === 'male'}
                        onChange={handleChange}
                      />
                      <i className="fas fa-mars"></i>
                      Homme
                    </label>
                    <label className={`gender-option ${formData.genre === 'female' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="genre"
                        value="female"
                        checked={formData.genre === 'female'}
                        onChange={handleChange}
                      />
                      <i className="fas fa-venus"></i>
                      Femme
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  icon={<i className="fas fa-save"></i>}
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <i className="fas fa-book"></i>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">Formations suivies</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-heart"></i>
            <div className="stat-info">
              <span className="stat-value">{user?.favoris?.length || 0}</span>
              <span className="stat-label">Favoris</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-calendar-check"></i>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">Réservations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;