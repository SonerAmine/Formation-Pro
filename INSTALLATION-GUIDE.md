# 🚀 Guide d'Installation et de Démarrage - FormationPro

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1. **Node.js** (version 14 ou supérieure) - [Télécharger ici](https://nodejs.org/)
2. **MongoDB** - [Télécharger ici](https://www.mongodb.com/try/download/community) OU utiliser MongoDB Atlas
3. **Git** - [Télécharger ici](https://git-scm.com/)

## ⚙️ Configuration

### Étape 1: Configuration des fichiers d'environnement

#### 🔧 Backend (.env)

1. Naviguez vers le dossier `backend/`
2. Créez un fichier nommé `.env` (exactement ce nom)
3. Copiez le contenu de `backend/env-config.txt` dans ce nouveau fichier `.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/formationpro
JWT_SECRET=votre-super-secret-jwt-changez-en-production-123456789
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=votre-refresh-token-secret-changez-en-production-987654321
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=12
```

#### 🎨 Frontend (.env)

1. Naviguez vers le dossier `frontend/`
2. Créez un fichier nommé `.env` (exactement ce nom)
3. Copiez le contenu de `frontend/env-config.txt` dans ce nouveau fichier `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=FormationPro
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=true
BROWSER=none
```

### Étape 2: Installation des dépendances

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

## 🗄️ Configuration de la base de données

### Option A: MongoDB Local

1. **Installer MongoDB Community Server**
2. **Démarrer MongoDB** :
   - Windows : Le service démarre automatiquement
   - macOS : `brew services start mongodb/brew/mongodb-community`
   - Linux : `sudo systemctl start mongod`

### Option B: MongoDB Atlas (Cloud)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit
3. Obtenez votre URI de connexion
4. Remplacez `MONGODB_URI` dans le fichier `.env` du backend

## 🚀 Démarrage de l'application

### ⚡ Démarrage rapide

**1. Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**2. Terminal 2 - Frontend :**
```bash
cd frontend
npm start
```

### 📱 Accès à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **Health Check** : http://localhost:5000/health

## 🔧 Scripts disponibles

### Backend (`backend/package.json`)
```bash
npm run dev      # Démarrage en mode développement avec nodemon
npm start        # Démarrage en mode production
```

### Frontend (`frontend/package.json`)
```bash
npm start        # Démarrage du serveur de développement
npm run build    # Build de production
npm test         # Tests
```

## 👤 Création d'un compte administrateur

### Méthode 1: Via l'interface
1. Créez un compte normal via l'interface d'inscription
2. Connectez-vous à MongoDB
3. Exécutez cette commande :
```javascript
db.users.updateOne(
  { email: "votre-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Méthode 2: Via MongoDB Compass
1. Ouvrez MongoDB Compass
2. Connectez-vous à votre base de données
3. Naviguez vers la collection `users`
4. Modifiez le champ `role` de `user` à `admin`

## 🔍 Test des fonctionnalités

### Utilisateur normal :
- ✅ Inscription/Connexion
- ✅ Navigation dans les formations
- ✅ Ajout aux favoris
- ✅ Réservation de formations
- ✅ Commentaires et avis

### Administrateur :
- ✅ Dashboard admin
- ✅ Gestion des formations (CRUD)
- ✅ Gestion des utilisateurs
- ✅ Statistiques
- ✅ Modération

## 🛠️ Résolution des problèmes courants

### ❌ Erreur de connexion MongoDB
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution :** Vérifiez que MongoDB est démarré

### ❌ Erreur CORS
```bash
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution :** Vérifiez que `FRONTEND_URL` dans le backend `.env` correspond à l'URL du frontend

### ❌ Erreur JWT
```bash
jwt malformed
```
**Solution :** Vérifiez que `JWT_SECRET` est défini dans le fichier `.env` du backend

### ❌ Port déjà utilisé
```bash
Error: listen EADDRINUSE :::3000
```
**Solution :** Changez le port ou tuez le processus qui utilise le port

## 📚 Structure des données

### Formations d'exemple

Vous pouvez créer des formations via le dashboard admin ou directement en base :

```javascript
{
  "titre": "Formation React Avancée",
  "description": "Maîtrisez React et ses concepts avancés",
  "prix": 299,
  "duree": 40,
  "placesTotales": 20,
  "placesRestantes": 20,
  "dateLimite": "2024-12-31T23:59:59.000Z",
  "categorie": "tech",
  "statut": "publiee"
}
```

## 🔐 Sécurité

### Changement des secrets en production

**IMPORTANT** : Avant de déployer en production, changez :
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- Utilisez des URI MongoDB sécurisées
- Activez HTTPS

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans les terminaux
2. Consultez la console du navigateur (F12)
3. Vérifiez que tous les prérequis sont installés
4. Redémarrez les serveurs

## 🎉 Vous êtes prêt !

Votre plateforme FormationPro est maintenant opérationnelle ! 

- Frontend : http://localhost:3000
- Backend : http://localhost:5000

Profitez de votre plateforme de formation professionnelle ! 🎓✨
