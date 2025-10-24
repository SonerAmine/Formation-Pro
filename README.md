# 🎓 FormationPro - Plateforme de Réservation de Formations

Une plateforme web professionnelle moderne pour la réservation de formations professionnelles, développée avec React, Node.js, Express et MongoDB.

## 📋 Table des matières

- [Aperçu du projet](#aperçu-du-projet)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Technologies utilisées](#technologies-utilisées)
- [Structure du projet](#structure-du-projet)
- [Installation et configuration](#installation-et-configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Sécurité](#sécurité)
- [Déploiement](#déploiement)

## 🎯 Aperçu du projet

FormationPro est une plateforme complète qui permet aux utilisateurs de :
- **Consulter** les formations disponibles avec filtres et recherche
- **Réserver** des formations en ligne (une fois par personne)
- **Gérer** leurs favoris et réservations
- **Commenter** et évaluer les formations suivies
- **Administrer** la plateforme (pour les admins)

## ✨ Fonctionnalités principales

### 👥 Gestion des utilisateurs
- ✅ Inscription et connexion sécurisées
- ✅ Profils utilisateurs avec informations personnelles
- ✅ Rôles utilisateur (User/Admin)
- ✅ Système de favoris
- ✅ Historique des réservations

### 🎓 Gestion des formations
- ✅ Catalogue de formations avec descriptions complètes
- ✅ Système de catégories et filtres
- ✅ Recherche textuelle avancée
- ✅ Gestion des places disponibles
- ✅ Dates limites d'inscription

### 📅 Système de réservations
- ✅ Réservation en ligne simplifiée
- ✅ Une seule réservation par utilisateur par formation
- ✅ Annulation possible avant la date limite
- ✅ Gestion automatique des places restantes

### 💬 Commentaires et avis
- ✅ Système de commentaires avec notes (1-5 étoiles)
- ✅ Modération des commentaires
- ✅ Système de likes et signalements

### 🛠️ Administration
- ✅ Dashboard administrateur complet
- ✅ Gestion des utilisateurs (bannissement, offres spéciales)
- ✅ CRUD complet des formations
- ✅ Statistiques et analytics
- ✅ Modération des contenus

### 🎨 UI/UX
- ✅ Design moderne et responsive
- ✅ Animations CSS fluides
- ✅ Interface intuitive
- ✅ Thème sombre/clair
- ✅ Accessibilité

## 🚀 Technologies utilisées

### Frontend
- **React 18** - Interface utilisateur
- **React Router DOM** - Navigation
- **Axios** - Appels API
- **CSS3** - Styling avec animations
- **Font Awesome** - Icônes

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification
- **bcryptjs** - Hachage des mots de passe

### Sécurité
- **Helmet** - Sécurité des headers HTTP
- **CORS** - Contrôle d'accès cross-origin
- **Rate Limiting** - Protection contre le spam
- **Express Validator** - Validation des données

## 📁 Structure du projet

```
FormationPro/
├── frontend/                 # Application React
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   └── src/
│       ├── components/       # Composants réutilisables
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── FormInput.jsx
│       │   └── Button.jsx
│       ├── pages/           # Pages principales
│       │   ├── Home.jsx
│       │   ├── FormationList.jsx
│       │   ├── FormationDetails.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── MyReservations.jsx
│       │   └── Favorites.jsx
│       ├── context/         # Contexte React
│       │   └── AuthContext.js
│       ├── services/        # Services API
│       │   └── api.js
│       ├── styles/          # Fichiers CSS
│       │   ├── global.css
│       │   ├── animations.css
│       │   └── [autres].css
│       └── App.js           # Composant principal
│
├── backend/                 # API Node.js
│   └── src/
│       ├── config/          # Configuration
│       │   └── db.js
│       ├── models/          # Modèles Mongoose
│       │   ├── User.js
│       │   ├── Formation.js
│       │   ├── Reservation.js
│       │   └── Comment.js
│       ├── controllers/     # Contrôleurs
│       │   ├── authController.js
│       │   ├── formationController.js
│       │   ├── reservationController.js
│       │   ├── commentController.js
│       │   ├── userController.js
│       │   └── adminController.js
│       ├── routes/          # Routes Express
│       │   ├── authRoutes.js
│       │   ├── formationRoutes.js
│       │   ├── reservationRoutes.js
│       │   ├── commentRoutes.js
│       │   ├── userRoutes.js
│       │   └── adminRoutes.js
│       ├── middlewares/     # Middlewares
│       │   ├── authMiddleware.js
│       │   ├── validationMiddleware.js
│       │   └── errorMiddleware.js
│       └── server.js        # Point d'entrée
│
└── README.md               # Documentation
```

## 🛠️ Installation et configuration

### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB (local ou Atlas)
- npm ou yarn

### 1. Cloner le projet
```bash
git clone [votre-repo]
cd FormationPro
```

### 2. Configuration du Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` dans le dossier `backend/` :
```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/formationpro

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Configuration du Frontend

```bash
cd frontend
npm install
```

Créer un fichier `.env` dans le dossier `frontend/` :
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=FormationPro
```

### 4. Démarrage des serveurs

**Backend** (dans le dossier `backend/`) :
```bash
npm run dev
```

**Frontend** (dans le dossier `frontend/`) :
```bash
npm start
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000

## 📖 Utilisation

### Première utilisation

1. **Accéder à l'application** : http://localhost:3000
2. **Créer un compte** utilisateur via la page d'inscription
3. **Naviguer** dans le catalogue de formations
4. **Réserver** des formations qui vous intéressent

### Compte administrateur

Pour créer un compte administrateur, connectez-vous à MongoDB et modifiez le rôle d'un utilisateur :

```javascript
// Dans MongoDB
db.users.updateOne(
  { email: "admin@formationpro.com" },
  { $set: { role: "admin" } }
)
```

### Fonctionnalités disponibles

#### Pour tous les utilisateurs :
- 👀 Consulter le catalogue de formations
- 🔍 Rechercher et filtrer les formations
- 📋 Voir les détails d'une formation

#### Utilisateurs connectés :
- 📝 S'inscrire et se connecter
- ❤️ Ajouter des formations aux favoris
- 🎫 Réserver des formations
- 🗑️ Annuler des réservations
- 💬 Commenter et noter les formations
- 📊 Consulter l'historique des réservations

#### Administrateurs :
- 🎓 Créer, modifier, supprimer des formations
- 👥 Gérer les utilisateurs (bannir, débannir)
- 🎁 Attribuer des offres spéciales
- 📈 Accéder aux statistiques détaillées
- 🛡️ Modérer les commentaires

## 🔗 API Documentation

### Endpoints principaux

#### Authentification
```
POST /api/auth/register      # Inscription
POST /api/auth/login         # Connexion
GET  /api/auth/me           # Profil utilisateur
PUT  /api/auth/profile      # Mise à jour profil
```

#### Formations
```
GET    /api/formations              # Liste des formations
GET    /api/formations/:id          # Détails d'une formation
POST   /api/formations              # Créer (Admin)
PUT    /api/formations/:id          # Modifier (Admin)
DELETE /api/formations/:id          # Supprimer (Admin)
```

#### Réservations
```
POST /api/reservations              # Créer une réservation
GET  /api/reservations/my           # Mes réservations
PUT  /api/reservations/:id/cancel   # Annuler une réservation
```

#### Favoris
```
GET    /api/users/favorites                # Mes favoris
POST   /api/users/favorites/:formationId  # Ajouter aux favoris
DELETE /api/users/favorites/:formationId  # Retirer des favoris
```

#### Administration
```
GET /api/admin/stats                # Statistiques
GET /api/admin/users               # Liste des utilisateurs
PUT /api/admin/users/:id/ban       # Bannir un utilisateur
```

### Format des réponses

Toutes les réponses suivent le format :
```json
{
  "success": true|false,
  "message": "Message descriptif",
  "data": { /* données */ },
  "error": "Message d'erreur" // en cas d'erreur
}
```

## 🔒 Sécurité

### Mesures implémentées
- ✅ **Authentification JWT** avec refresh tokens
- ✅ **Hachage bcrypt** des mots de passe (12 rounds)
- ✅ **Rate limiting** (100 req/15min, 10 login/15min)
- ✅ **Validation** des données d'entrée
- ✅ **Headers de sécurité** avec Helmet
- ✅ **Protection CORS** configurée
- ✅ **Middleware d'autorisation** par rôles
- ✅ **Sanitisation** des données utilisateur

### Bonnes pratiques
- Variables d'environnement pour les secrets
- Pas de données sensibles dans les logs
- Validation côté client et serveur
- Gestion des erreurs sécurisée

## 🚀 Déploiement

### Frontend (Vercel/Netlify)
1. Build de production : `npm run build`
2. Déployer le dossier `build/`
3. Configurer les variables d'environnement

### Backend (Heroku/Render/Railway)
1. Configurer les variables d'environnement
2. Connecter à MongoDB Atlas
3. Déployer le code backend
4. Configurer les domaines dans CORS

### Base de données (MongoDB Atlas)
1. Créer un cluster MongoDB Atlas
2. Configurer les accès réseau
3. Mettre à jour MONGODB_URI

### Variables d'environnement de production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-production-secret
FRONTEND_URL=https://your-domain.com
```

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou support :
- 📧 Email : contact@formationpro.com
- 🐛 Issues : Créer une issue sur GitHub
- 📖 Documentation : Consulter ce README

---

**FormationPro** - Développez vos compétences professionnelles ! 🎓✨
