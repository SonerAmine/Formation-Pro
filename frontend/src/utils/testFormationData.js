/**
 * Données de test pour la création de formation
 * Utile pour déboguer les erreurs 400
 */

export const getMinimalFormationData = () => ({
  titre: 'Formation Test React',
  description: 'Une formation complète sur React pour les développeurs qui souhaitent maîtriser cette technologie moderne.',
  prix: 299.99,
  duree: 14,
  placesTotales: 20,
  placesRestantes: 20,
  categorie: 'tech',
  niveau: 'debutant',
  mode: 'presentiel',
  statut: 'brouillon'
});

export const getCompleteFormationData = () => ({
  titre: 'Formation React Avancé',
  description: 'Une formation complète et approfondie sur React pour maîtriser tous les concepts avancés et les meilleures pratiques.',
  descriptionComplete: 'Cette formation vous permettra de devenir un expert React. Nous couvrirons les hooks avancés, la gestion d\'état, les patterns de performance, et bien plus encore.',
  prix: 599.99,
  duree: 28,
  placesTotales: 15,
  placesRestantes: 15,
  dateDebut: '2024-02-15T09:00',
  dateFin: '2024-02-19T17:00',
  categorie: 'tech',
  niveau: 'avance',
  mode: 'hybride',
  statut: 'brouillon',
  
  lieu: {
    adresse: '123 Rue de la Tech',
    ville: 'Paris',
    codePostal: '75001',
    salle: 'Salle A1'
  },
  
  lienVisio: 'https://meet.google.com/abc-defg-hij',
  
  formateur: {
    nom: 'Jean Dupont',
    bio: 'Développeur React avec 8 ans d\'expérience, expert en performance et architecture.',
    expertise: ['React', 'JavaScript', 'Performance', 'Architecture']
  },
  
  prerequis: [
    'Connaissance de base de JavaScript',
    'Notions de HTML/CSS',
    'Expérience avec un éditeur de code'
  ],
  
  objectifs: [
    'Maîtriser React et ses concepts avancés',
    'Optimiser les performances des applications',
    'Architecturer des applications complexes',
    'Utiliser les dernières features React'
  ],
  
  programme: [
    {
      titre: 'Introduction et rappels',
      description: 'Rappels sur les concepts de base, nouveautés React 18+',
      duree: 4
    },
    {
      titre: 'Hooks avancés',
      description: 'useCallback, useMemo, useContext, hooks personnalisés',
      duree: 6
    },
    {
      titre: 'Gestion d\'état',
      description: 'Context API, Zustand, Redux Toolkit',
      duree: 8
    },
    {
      titre: 'Performance',
      description: 'Profiling, lazy loading, optimisations',
      duree: 6
    },
    {
      titre: 'Tests et déploiement',
      description: 'Jest, Testing Library, déploiement',
      duree: 4
    }
  ],
  
  materiel: [
    'Support de cours PDF',
    'Code source des exercices',
    'Accès plateforme e-learning 3 mois',
    'Certificat de completion'
  ],
  
  certification: {
    disponible: true,
    nom: 'Certification React Developer Expert',
    organisme: 'Tech Institute Paris'
  },
  
  tags: ['react', 'javascript', 'frontend', 'spa', 'hooks', 'performance']
});

export const debugFormationData = (data) => {
  console.group('🔍 Debug Formation Data');
  console.log('📊 Champs obligatoires:');
  console.log('- titre:', data.titre, '(length:', data.titre?.length, ')');
  console.log('- description:', data.description, '(length:', data.description?.length, ')');
  console.log('- prix:', data.prix, '(type:', typeof data.prix, ')');
  console.log('- duree:', data.duree, '(type:', typeof data.duree, ')');
  console.log('- placesTotales:', data.placesTotales, '(type:', typeof data.placesTotales, ')');
  console.log('- categorie:', data.categorie);
  
  console.log('📅 Dates:');
  console.log('- dateDebut:', data.dateDebut);
  console.log('- dateFin:', data.dateFin);
  
  console.log('📍 Mode et lieu:');
  console.log('- mode:', data.mode);
  console.log('- lieu:', data.lieu);
  console.log('- lienVisio:', data.lienVisio);
  
  console.log('📋 Données complètes:', data);
  console.groupEnd();
};
