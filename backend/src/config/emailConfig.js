// Configuration email Gmail uniquement
const emailConfig = {
  // Configuration Gmail obligatoire
  gmail: {
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    }
  }
};

// Fonction pour obtenir la configuration Gmail
function getEmailConfig() {
  // Vérifier si on a des credentials Gmail
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📧 Using Gmail SMTP configuration');
    return emailConfig.gmail;
  }

  // Si pas de credentials Gmail, afficher une erreur claire
  console.error('❌ ERREUR: Credentials Gmail manquants!');
  console.error('📧 Veuillez configurer EMAIL_USER et EMAIL_PASS dans le fichier .env');
  console.error('📧 Exemple:');
  console.error('   EMAIL_USER=votre-email@gmail.com');
  console.error('   EMAIL_PASS=votre-mot-de-passe-app-gmail');
  
  throw new Error('Configuration email Gmail requise. Veuillez configurer EMAIL_USER et EMAIL_PASS dans le fichier .env');
}

module.exports = {
  emailConfig,
  getEmailConfig
};
