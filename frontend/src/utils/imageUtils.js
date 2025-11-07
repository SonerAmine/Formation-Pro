/**
 * Utilitaires pour la gestion des images de profil
 */

/**
 * Construit l'URL complète d'une image de profil
 * @param {string} avatar - Chemin ou URL de l'avatar
 * @param {string} genre - Genre de l'utilisateur pour l'avatar par défaut
 * @returns {string} URL complète de l'image
 */
export const getAvatarUrl = (avatar, genre = 'male') => {
  // Si pas d'avatar, retourner l'avatar par défaut
  if (!avatar) {
    return genre === 'female' 
      ? '/photos/avatar-female-default.svg' 
      : '/photos/avatar-male-default.svg';
  }

  // Obtenir l'URL de base de l'API (sans /api)
  const getBaseUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace('/api', '');
  };

  // Si c'est déjà une URL complète (http/https)
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    // Corriger les URLs localhost en production
    if (avatar.includes('localhost') || avatar.includes('127.0.0.1')) {
      const baseUrl = getBaseUrl();
      // Extraire le nom du fichier de l'URL
      const filename = avatar.split('/').pop();
      // Reconstruire avec l'URL de production
      return `${baseUrl}/uploads/${filename}`;
    }
    // Utiliser l'URL telle quelle si elle est déjà correcte
    return avatar;
  }

  // Si c'est un chemin relatif, construire l'URL complète
  if (avatar.startsWith('/uploads/')) {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${avatar}`;
  }

  // Si c'est un nom de fichier avatar, construire l'URL complète
  if (avatar.includes('avatar-')) {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/uploads/${avatar}`;
  }

  // Par défaut, retourner l'avatar par défaut
  return genre === 'female' 
    ? '/photos/avatar-female-default.svg' 
    : '/photos/avatar-male-default.svg';
};

/**
 * Vérifie si une URL d'image est valide
 * @param {string} url - URL de l'image
 * @returns {Promise<boolean>} True si l'image est accessible
 */
export const isValidImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Image URL validation failed:', error);
    return false;
  }
};

/**
 * Gère l'erreur de chargement d'image
 * @param {Event} event - Événement d'erreur
 * @param {string} genre - Genre pour l'avatar par défaut
 */
export const handleImageError = (event, genre = 'male') => {
  const failedUrl = event.target.src;
  console.warn('❌ Image failed to load:', failedUrl);
  
  // Essayer de diagnostiquer le problème
  if (failedUrl.includes('localhost')) {
    console.warn('⚠️ URL contient localhost - devrait être corrigée automatiquement');
  }
  
  if (failedUrl.includes('http://')) {
    console.warn('⚠️ URL utilise HTTP au lieu de HTTPS');
  }
  
  // Vérifier si l'URL est tronquée (pas d'extension)
  const urlParts = failedUrl.split('.');
  if (urlParts.length === 1 || !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => failedUrl.toLowerCase().endsWith('.' + ext))) {
    console.warn('⚠️ URL semble tronquée ou sans extension valide');
  }
  
  // Utiliser l'avatar par défaut
  event.target.src = genre === 'female' 
    ? '/photos/avatar-female-default.svg' 
    : '/photos/avatar-male-default.svg';
};
