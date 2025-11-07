# 📚 Guide étape par étape : Publier votre projet sur GitHub

Ce guide vous explique comment publier votre projet FormationPro sur GitHub.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :
- ✅ Un compte GitHub (créez-en un sur [github.com](https://github.com) si nécessaire)
- ✅ Git installé sur votre machine (téléchargez-le sur [git-scm.com](https://git-scm.com))
- ✅ GitHub CLI (optionnel, mais recommandé) ou un accès web à GitHub

---

## 🚀 Étapes détaillées

### **Étape 1 : Vérifier l'installation de Git**

Ouvrez PowerShell ou l'invite de commandes et vérifiez que Git est installé :

```powershell
git --version
```

Si Git n'est pas installé, téléchargez-le depuis [git-scm.com](https://git-scm.com/download/win).

---

### **Étape 2 : Initialiser Git dans votre projet**

1. Ouvrez PowerShell dans le dossier de votre projet :
   ```powershell
   cd C:\Users\PC\Desktop\Formation
   ```

2. Initialisez le dépôt Git :
   ```powershell
   git init
   ```

3. Vérifiez que Git a été initialisé :
   ```powershell
   git status
   ```

---

### **Étape 3 : Configurer Git (si ce n'est pas déjà fait)**

Configurez votre nom et email (nécessaire pour les commits) :

```powershell
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

---

### **Étape 4 : Créer un dépôt sur GitHub**

1. **Connectez-vous à GitHub** : Allez sur [github.com](https://github.com) et connectez-vous

2. **Créer un nouveau dépôt** :
   - Cliquez sur le bouton **"+"** en haut à droite
   - Sélectionnez **"New repository"**
   - Remplissez les informations :
     - **Repository name** : `formation-pro` (ou le nom de votre choix)
     - **Description** : "Plateforme de réservation de formations professionnelles"
     - **Visibilité** : Public ou Private (selon votre préférence)
     - ⚠️ **NE COCHEZ PAS** "Initialize this repository with a README" (on a déjà un README)
     - ⚠️ **NE COCHEZ PAS** "Add .gitignore" (on a déjà un .gitignore)
   - Cliquez sur **"Create repository"**

3. **Copiez l'URL du dépôt** :
   - GitHub vous donnera une URL comme : `https://github.com/votre-username/formation-pro.git`
   - Copiez cette URL, vous en aurez besoin à l'étape suivante

---

### **Étape 5 : Ajouter tous les fichiers au dépôt**

Dans PowerShell, toujours dans le dossier `C:\Users\PC\Desktop\Formation` :

```powershell
# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Vérifier les fichiers qui seront commités
git status
```

Vous devriez voir tous vos fichiers listés en vert (staged).

---

### **Étape 6 : Créer le premier commit**

```powershell
git commit -m "Initial commit: Plateforme de réservation de formations"
```

---

### **Étape 7 : Connecter votre dépôt local à GitHub**

Remplacez `votre-username` et `formation-pro` par vos vraies valeurs :

```powershell
git remote add origin https://github.com/votre-username/formation-pro.git
```

Pour vérifier que la connexion est bien établie :

```powershell
git remote -v
```

---

### **Étape 8 : Pousser votre code sur GitHub**

```powershell
git branch -M main
git push -u origin main
```

**Note** : Si c'est la première fois que vous utilisez GitHub sur cette machine, vous devrez vous authentifier :
- **Option 1 (Recommandée)** : Utilisez un Personal Access Token (PAT)
  - Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Créez un nouveau token avec les permissions `repo`
  - Utilisez ce token comme mot de passe lors du `git push`

- **Option 2** : Utilisez GitHub CLI (`gh auth login`)

---

### **Étape 9 : Vérifier sur GitHub**

1. Allez sur votre dépôt GitHub : `https://github.com/votre-username/formation-pro`
2. Vous devriez voir tous vos fichiers !

---

## 🔐 Authentification GitHub (Détails)

### Méthode 1 : Personal Access Token (PAT)

1. Allez sur [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Cliquez sur **"Generate new token (classic)"**
3. Donnez un nom au token (ex: "FormationPro")
4. Sélectionnez la durée d'expiration
5. Cochez la permission **`repo`** (accès complet aux dépôts)
6. Cliquez sur **"Generate token"**
7. **⚠️ COPIEZ LE TOKEN** (vous ne pourrez plus le voir après)
8. Quand Git vous demande votre mot de passe, utilisez ce token

### Méthode 2 : GitHub CLI

```powershell
# Installer GitHub CLI (si pas déjà installé)
# Téléchargez depuis : https://cli.github.com/

# Se connecter
gh auth login

# Suivez les instructions à l'écran
```

---

## 📝 Commandes Git utiles

```powershell
# Voir l'état des fichiers
git status

# Voir l'historique des commits
git log

# Ajouter un fichier spécifique
git add nom-du-fichier.js

# Créer un commit
git commit -m "Description des changements"

# Pousser les changements
git push

# Récupérer les changements depuis GitHub
git pull

# Voir les branches
git branch

# Créer une nouvelle branche
git branch nom-de-la-branche

# Changer de branche
git checkout nom-de-la-branche
```

---

## 🛠️ Résolution de problèmes

### Problème : "Permission denied (publickey)"
**Solution** : Utilisez HTTPS au lieu de SSH, ou configurez une clé SSH.

### Problème : "Repository not found"
**Solution** : Vérifiez que l'URL du dépôt est correcte et que vous avez les permissions.

### Problème : "Authentication failed"
**Solution** : 
- Utilisez un Personal Access Token au lieu de votre mot de passe
- Vérifiez que le token a les bonnes permissions

### Problème : Fichiers sensibles committés par erreur
**Solution** : Si vous avez commité des fichiers `.env` ou des mots de passe :
1. Supprimez-les du commit : `git rm --cached .env`
2. Ajoutez-les au `.gitignore`
3. Commitez : `git commit -m "Remove sensitive files"`
4. Poussez : `git push`

---

## ✅ Checklist finale

- [ ] Git est installé et configuré
- [ ] Dépôt GitHub créé
- [ ] `.gitignore` est à la racine du projet
- [ ] Tous les fichiers sont ajoutés (`git add .`)
- [ ] Premier commit créé
- [ ] Dépôt local connecté à GitHub (`git remote add origin`)
- [ ] Code poussé sur GitHub (`git push`)
- [ ] Vérifié sur GitHub que tout est présent

---

## 🎉 Félicitations !

Votre projet est maintenant sur GitHub ! Vous pouvez :
- Partager le lien avec d'autres développeurs
- Collaborer sur le projet
- Déployer depuis GitHub
- Utiliser GitHub Actions pour CI/CD

---

**Besoin d'aide ?** Consultez la [documentation GitHub](https://docs.github.com) ou posez une question sur [Stack Overflow](https://stackoverflow.com).

