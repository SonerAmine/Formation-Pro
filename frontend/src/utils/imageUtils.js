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

  // Si c'est déjà une URL complète (http/https), l'utiliser directement
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }

  // Si c'est un chemin relatif, construire l'URL complète
  if (avatar.startsWith('/uploads/')) {
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${avatar}`;
  }

  // Si c'est un nom de fichier avatar, construire l'URL complète
  if (avatar.includes('avatar-')) {
    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
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
  console.warn('Image failed to load:', event.target.src);
  event.target.src = genre === 'female' 
    ? '/photos/avatar-female-default.svg' 
    : '/photos/avatar-male-default.svg';
};
