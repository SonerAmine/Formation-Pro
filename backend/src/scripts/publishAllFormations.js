/**
 * Script pour publier toutes les formations en brouillon
 * À utiliser quand on veut rendre visibles les formations existantes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Formation = require('../models/Formation');

const publishAllFormations = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/formation-platform');
    console.log('✅ Connexion à MongoDB établie');

    // Trouver toutes les formations en brouillon
    const formationsEnBrouillon = await Formation.find({ statut: 'brouillon' });
    console.log(`📋 ${formationsEnBrouillon.length} formation(s) en brouillon trouvée(s)`);

    if (formationsEnBrouillon.length === 0) {
      console.log('🎉 Toutes les formations sont déjà publiées !');
      process.exit(0);
    }

    // Publier toutes les formations
    const result = await Formation.updateMany(
      { statut: 'brouillon' },
      { 
        $set: { 
          statut: 'publiee',
          active: true 
        } 
      }
    );

    console.log(`🚀 ${result.modifiedCount} formation(s) publiée(s) avec succès !`);

    // Afficher les formations publiées
    const formationsPubliees = await Formation.find({ statut: 'publiee' });
    console.log('\n📚 Formations maintenant visibles :');
    formationsPubliees.forEach((formation, index) => {
      console.log(`${index + 1}. ${formation.titre} (${formation.categorie}) - ${formation.prix}€`);
    });

    console.log('\n✅ Script terminé avec succès !');
    console.log('🌐 Vos formations sont maintenant visibles sur le site.');

  } catch (error) {
    console.error('❌ Erreur lors de la publication des formations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Déconnexion de MongoDB');
    process.exit(0);
  }
};

// Exécuter le script
publishAllFormations();
