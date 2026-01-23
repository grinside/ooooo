# 🚀 Comment Lancer Max IT TV Affiliation

## Méthode Ultra-Rapide (1 commande)

```bash
cd /home/user/ooooo
./launch.sh
```

**C'est tout !** Le script va :
- ✅ Lancer le backend (API sur port 3000)
- ✅ Lancer le frontend (React sur port 5173)
- ✅ Afficher toutes les URLs d'accès

---

## Méthode Manuelle (2 terminaux)

### Terminal 1 - Backend

```bash
cd /home/user/ooooo/backend
npm run dev
```

### Terminal 2 - Frontend

```bash
cd /home/user/ooooo/frontend
npm run dev
```

---

## 🌐 Accès aux Interfaces

Une fois lancé, ouvrez votre navigateur :

### Frontend
- **Landing Page** : http://localhost:5173
- **Inscription Affilié** : http://localhost:5173/affiliate/register
- **Login Affilié** : http://localhost:5173/affiliate/login
- **Admin Login** : http://localhost:5173/admin/login

### Backend API
- **API Health** : http://localhost:3000/api/v1/health
- **API Docs** : http://localhost:3000/api/v1

---

## 👤 Comptes de Test

### Admin
- **Email** : admin@maxittv.com
- **Password** : Admin@123

### Tester l'inscription Affilié
- Allez sur : http://localhost:5173/affiliate/register
- Remplissez le formulaire
- Créez un PIN à 4 chiffres

---

## 🛑 Arrêter l'Application

Si vous avez utilisé `./launch.sh` :
```bash
Ctrl + C
```

Si vous avez lancé manuellement :
- Arrêtez chaque terminal avec `Ctrl + C`

---

## 📊 Voir les Logs

```bash
# Backend
tail -f /home/user/ooooo/logs/backend.log

# Frontend
tail -f /home/user/ooooo/logs/frontend.log

# Les deux en même temps
tail -f /home/user/ooooo/logs/*.log
```

---

## ⚠️ Résolution de Problèmes

### Erreur "Port already in use"

```bash
# Trouver et tuer le processus sur port 3000
lsof -ti:3000 | xargs kill -9

# Trouver et tuer le processus sur port 5173
lsof -ti:5173 | xargs kill -9
```

### Erreur "Cannot find module"

```bash
# Réinstaller les dépendances backend
cd /home/user/ooooo/backend
rm -rf node_modules package-lock.json
npm install

# Réinstaller les dépendances frontend
cd /home/user/ooooo/frontend
rm -rf node_modules package-lock.json
npm install
```

### Base de données non connectée

En mode développement, l'application fonctionne même sans base de données PostgreSQL.
Les fonctionnalités nécessitant la DB retourneront des erreurs, mais l'interface sera accessible.

Pour une installation complète avec base de données :
```bash
# Installer PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Créer la base de données
sudo -u postgres createdb maxittv_dev
sudo -u postgres createuser maxittv -s

# Lancer les migrations
cd /home/user/ooooo/backend
node src/scripts/migrate.js
node src/scripts/seed.js
```

---

## 🔧 Configuration Avancée

### Changer les Ports

Éditez les fichiers `.env` :

**Backend** (`backend/.env`) :
```env
PORT=3000
```

**Frontend** (`frontend/.env`) :
```env
VITE_API_URL=http://localhost:3000/api
```

### Activer les Vraies Intégrations

Éditez `backend/.env` et ajoutez vos clés API :

```env
# Orange Money
ORANGE_MONEY_API_KEY=votre_clé
ORANGE_MONEY_API_SECRET=votre_secret

# SMS
SMS_PROVIDER=orange
ORANGE_SMS_CLIENT_ID=votre_id
ORANGE_SMS_CLIENT_SECRET=votre_secret
```

---

## 📚 Documentation Complète

- **README.md** - Documentation complète du projet
- **QUICKSTART.md** - Guide de démarrage rapide
- **PROJECT_SUMMARY.md** - Vue d'ensemble du système

---

## ✅ Checklist Premier Lancement

- [ ] Node.js installé (v22+)
- [ ] Dépendances installées (`./start-dev.sh`)
- [ ] Fichiers `.env` créés
- [ ] Services lancés (`./launch.sh`)
- [ ] Frontend accessible sur http://localhost:5173
- [ ] Backend répond sur http://localhost:3000/api/v1/health

---

**Bon développement ! 🚀**
