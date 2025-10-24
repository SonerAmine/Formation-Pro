/**
 * Utilitaires pour la gestion sécurisée des réponses API
 */

/**
 * Extrait les données d'une réponse API en s'assurant que c'est un tableau
 * @param {Object} response - La réponse de l'API
 * @param {string} dataPath - Le chemin vers les données (par défaut 'data')
 * @returns {Array} Un tableau sécurisé
 */
export const extractArrayFromResponse = (response, dataPath = 'data') => {
  try {
    // Naviguer vers les données suivant le chemin spécifié
    const data = dataPath.split('.').reduce((obj, key) => obj?.[key], response);
    
    // S'assurer que c'est un tableau
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('Les données reçues ne sont pas un tableau:', data);
    return [];
  } catch (error) {
    console.error('Erreur lors de l\'extraction des données:', error);
    return [];
  }
};

/**
 * Extrait le message d'erreur d'une réponse API
 * @param {Object} error - L'erreur capturée
 * @param {string} defaultMessage - Message par défaut
 * @returns {string} Le message d'erreur
 */
export const extractErrorMessage = (error, defaultMessage = 'Une erreur est survenue') => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return defaultMessage;
};

/**
 * Vérifie si une réponse API est valide
 * @param {Object} response - La réponse à vérifier
 * @returns {boolean} True si la réponse est valide
 */
export const isValidApiResponse = (response) => {
  return response && 
         response.data && 
         typeof response.data === 'object' &&
         response.data.success !== false;
};

/**
 * Gestion centralisée des erreurs API
 * @param {Object} error - L'erreur capturée
 * @param {Function} setError - Fonction pour définir l'erreur dans le state
 * @param {Function} setData - Fonction pour réinitialiser les données
 * @param {string} context - Contexte de l'erreur pour le logging
 */
export const handleApiError = (error, setError, setData, context = 'API call') => {
  console.error(`Error in ${context}:`, error);
  
  const errorMessage = extractErrorMessage(error);
  setError(errorMessage);
  
  // Réinitialiser les données avec un tableau vide
  if (setData) {
    setData([]);
  }
};

/**
 * Wrapper pour les appels API avec gestion d'erreur intégrée
 * @param {Function} apiCall - La fonction d'appel API
 * @param {Function} setData - Fonction pour définir les données
 * @param {Function} setError - Fonction pour définir l'erreur
 * @param {Function} setLoading - Fonction pour gérer l'état de chargement
 * @param {string} dataPath - Chemin vers les données dans la réponse
 * @param {string} context - Contexte pour le logging
 */
export const safeApiCall = async (
  apiCall, 
  setData, 
  setError, 
  setLoading, 
  dataPath = 'data.data',
  context = 'API call'
) => {
  try {
    setLoading(true);
    setError('');
    
    const response = await apiCall();
    
    if (!isValidApiResponse(response)) {
      throw new Error('Réponse API invalide');
    }
    
    const data = extractArrayFromResponse(response, dataPath);
    setData(data);
    
  } catch (error) {
    handleApiError(error, setError, setData, context);
  } finally {
    setLoading(false);
  }
};
