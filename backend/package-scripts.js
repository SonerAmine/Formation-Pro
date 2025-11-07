/**
 * Scripts utilitaires pour la gestion de la plateforme
 */

const { execSync } = require('child_process');
const path = require('path');

const scripts = {
  // Publier toutes les formations en brouillon
  publishFormations: () => {
    console.log('🚀 Publication de toutes les formations...');
    execSync('node src/scripts/publishAllFormations.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
  },

  // Vérifier l'état de la base de données
  checkDatabase: () => {
    console.log('🔍 Vérification de la base de données...');
    execSync('node src/scripts/checkDatabase.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
  },

  // Migration des données si nécessaire
  migrate: () => {
    console.log('🔄 Migration des données...');
    execSync('node src/scripts/migrate.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
  }
};

// Exécuter le script demandé
const scriptName = process.argv[2];
if (scripts[scriptName]) {
  scripts[scriptName]();
} else {
  console.log('Scripts disponibles:');
  console.log('- publishFormations : Publier toutes les formations');
  console.log('- checkDatabase : Vérifier l\'état de la DB');
  console.log('- migrate : Migrer les données');
  console.log('\nUtilisation: node package-scripts.js <script-name>');
}

module.exports = scripts;
