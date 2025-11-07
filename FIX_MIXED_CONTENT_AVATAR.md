# 🔧 Correction de l'erreur Mixed Content pour les avatars

## ❌ Problème

L'erreur `Mixed Content` se produit quand :
- Le site est en HTTPS (`https://formationpro-frontend.onrender.com`)
- Mais l'URL de l'avatar pointe vers HTTP (`http://localhost:5000/uploads/...`)

Le navigateur bloque automatiquement les requêtes HTTP depuis une page HTTPS pour des raisons de sécurité.

## ✅ Solutions appliquées

### 1. Frontend - Correction automatique des URLs localhost

**Fichier** : `frontend/src/utils/imageUtils.js`

La fonction `getAvatarUrl()` a été améliorée pour :
- ✅ Détecter les URLs contenant `localhost` ou `127.0.0.1`
- ✅ Les remplacer automatiquement par l'URL de production
- ✅ Utiliser l'URL de l'API depuis les variables d'environnement

**Exemple** :
```javascript
// Avant (ne fonctionne pas)
avatar: "http://localhost:5000/uploads/avatar-xxx.jpg"

// Après (corrigé automatiquement)
avatar: "https://formation-pro.onrender.com/uploads/avatar-xxx.jpg"
```

### 2. Backend - Construction correcte de l'URL en production

**Fichier** : `backend/src/controllers/authController.js`

L'URL de l'avatar est maintenant construite avec :
- ✅ HTTPS forcé en production
- ✅ Utilisation de `BACKEND_URL` ou `RENDER_EXTERNAL_URL` si disponible
- ✅ Fallback sur l'URL de la requête avec HTTPS

### 3. Backend - Amélioration de la suppression de l'ancien avatar

La suppression de l'ancien avatar gère maintenant :
- ✅ Les URLs complètes (http/https)
- ✅ Les chemins relatifs
- ✅ Extraction correcte du nom de fichier

---

## 🔄 Migration des anciennes URLs

### Option 1 : Re-uploader la photo (Recommandé)

1. Aller sur la page Profile
2. Cliquer sur l'icône caméra
3. Sélectionner la même photo (ou une nouvelle)
4. Cliquer sur "Enregistrer les modifications"
5. La nouvelle URL sera correcte avec HTTPS

### Option 2 : Script de migration (Pour plusieurs utilisateurs)

Si vous avez plusieurs utilisateurs avec des URLs localhost, vous pouvez créer un script :

```javascript
// backend/src/scripts/fixAvatarUrls.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const fixAvatarUrls = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({ 
      avatar: { $regex: /localhost|127\.0\.0\.1/ } 
    });
    
    const backendUrl = process.env.BACKEND_URL || 'https://formation-pro.onrender.com';
    
    for (const user of users) {
      if (user.avatar) {
        const filename = user.avatar.split('/').pop();
        user.avatar = `${backendUrl}/uploads/${filename}`;
        await user.save();
        console.log(`✅ Avatar corrigé pour ${user.email}`);
      }
    }
    
    console.log(`✅ ${users.length} avatars corrigés`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

fixAvatarUrls();
```

---

## 🧪 Test

### 1. Vérifier que l'URL est corrigée

1. Ouvrir la console du navigateur (F12)
2. Aller sur la page Profile
3. Vérifier dans la console :
   ```
   ✅ Avatar URL mise à jour: https://formation-pro.onrender.com/uploads/avatar-xxx.jpg
   ```
4. L'image devrait s'afficher sans erreur Mixed Content

### 2. Vérifier dans le Network

1. Ouvrir l'onglet Network (F12)
2. Filtrer par "Img"
3. Vérifier que la requête vers l'avatar utilise HTTPS
4. Le statut devrait être 200 (OK)

---

## 📝 Configuration Render

### Variable d'environnement recommandée

Dans votre service backend sur Render, ajoutez :

```env
BACKEND_URL=https://formation-pro.onrender.com
```

Cela garantit que toutes les nouvelles URLs d'avatar utiliseront cette URL.

---

## ✅ Résultat attendu

Après les corrections :
- ✅ Plus d'erreur Mixed Content
- ✅ Les avatars s'affichent correctement
- ✅ Les nouvelles photos uploadées utilisent HTTPS
- ✅ Les anciennes URLs localhost sont automatiquement corrigées côté frontend

---

## 🔍 Vérification

### Console du navigateur

Avant (erreur) :
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure element 'http://localhost:5000/...'
```

Après (succès) :
```
✅ Avatar URL mise à jour: https://formation-pro.onrender.com/uploads/avatar-xxx.jpg
```

### Network Tab

- **Avant** : `http://localhost:5000/uploads/...` → ❌ Bloqué
- **Après** : `https://formation-pro.onrender.com/uploads/...` → ✅ 200 OK

---

**Les corrections sont maintenant dans le code. Les anciennes URLs localhost seront automatiquement corrigées côté frontend !**

