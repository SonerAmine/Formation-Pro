const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Script pour créer ou promouvoir un utilisateur en admin

async function createAdmin(email) {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/formationpro');
    console.log('✅ Connecté à MongoDB');

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ Utilisateur non trouvé avec l\'email:', email);
      console.log('💡 Créez d\'abord un compte avec cet email, puis relancez ce script.');
      process.exit(1);
    }

    // Vérifier s'il est déjà admin
    if (user.role === 'admin') {
      console.log('✅ Cet utilisateur est déjà admin !');
      console.log(`👤 ${user.prenom} ${user.nom} (${user.email})`);
      process.exit(0);
    }

    // Promouvoir en admin
    user.role = 'admin';
    await user.save();

    console.log('🎉 Utilisateur promu en ADMIN avec succès !');
    console.log('👤 Nom:', user.prenom, user.nom);
    console.log('📧 Email:', user.email);
    console.log('⚡ Rôle:', user.role);
    console.log('\n✅ Vous pouvez maintenant vous connecter et accéder au Dashboard Admin !');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.log('❌ Usage: node createAdmin.js <email>');
  console.log('📧 Exemple: node createAdmin.js bazizmohamedamine1@gmail.com');
  process.exit(1);
}

createAdmin(email);
