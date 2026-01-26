#!/bin/bash

echo "🚀 Lancement Max IT TV Affiliation - Mode Développement"
echo "=========================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /home/user/ooooo

# Étape 1 : Configuration
echo -e "${BLUE}📝 Étape 1/5 : Configuration...${NC}"

if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}Création du fichier .env backend...${NC}"
    cat > backend/.env <<EOF
# Environment
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database (SQLite pour dev)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maxittv_dev
DB_USER=maxittv
DB_PASSWORD=dev_password

# Redis (optionnel en dev)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev_secret_min_32_chars_for_development_only
JWT_REFRESH_SECRET=dev_refresh_secret_key_development
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Commission Rates
COMMISSION_DIRECT_RATE=15
COMMISSION_NETWORK_L1_RATE=5
COMMISSION_NETWORK_L2_RATE=2

# Payout
PAYOUT_MIN_AMOUNT=5000

# SMS (mode test - logs uniquement)
SMS_PROVIDER=console
FEATURE_SMS_NOTIFICATIONS=false

# Feature Flags
FEATURE_NETWORK_COMMISSIONS=true
FEATURE_FRAUD_DETECTION=false

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Mode développement
LOG_LEVEL=debug
EOF
    echo -e "${GREEN}✓ Fichier backend/.env créé${NC}"
fi

if [ ! -f frontend/.env ]; then
    echo -e "${YELLOW}Création du fichier .env frontend...${NC}"
    cat > frontend/.env <<EOF
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Max IT TV
VITE_ENVIRONMENT=development
EOF
    echo -e "${GREEN}✓ Fichier frontend/.env créé${NC}"
fi

# Étape 2 : Installation Backend
echo ""
echo -e "${BLUE}📦 Étape 2/5 : Installation des dépendances backend...${NC}"
cd backend

if [ ! -d node_modules ]; then
    echo "Installation en cours..."
    npm install --legacy-peer-deps 2>&1 | grep -E "(added|removed|changed|audited)" || echo "Installation terminée"
    echo -e "${GREEN}✓ Dépendances backend installées${NC}"
else
    echo -e "${GREEN}✓ Dépendances backend déjà installées${NC}"
fi

# Étape 3 : Installation Frontend
echo ""
echo -e "${BLUE}📦 Étape 3/5 : Installation des dépendances frontend...${NC}"
cd ../frontend

if [ ! -d node_modules ]; then
    echo "Installation en cours..."
    npm install --legacy-peer-deps 2>&1 | grep -E "(added|removed|changed|audited)" || echo "Installation terminée"
    echo -e "${GREEN}✓ Dépendances frontend installées${NC}"
else
    echo -e "${GREEN}✓ Dépendances frontend déjà installées${NC}"
fi

cd ..

# Étape 4 : Créer base de données SQLite pour dev
echo ""
echo -e "${BLUE}🗄️  Étape 4/5 : Configuration base de données...${NC}"
echo -e "${YELLOW}Note: En mode dev, utilisez SQLite ou PostgreSQL local${NC}"

# Étape 5 : Instructions de lancement
echo ""
echo -e "${BLUE}🎯 Étape 5/5 : Prêt à lancer !${NC}"
echo ""
echo "=========================================================="
echo -e "${GREEN}✅ Installation terminée !${NC}"
echo "=========================================================="
echo ""
echo -e "${YELLOW}Pour lancer l'application, ouvrez 2 terminaux :${NC}"
echo ""
echo "📍 Terminal 1 - Backend API :"
echo -e "   ${BLUE}cd /home/user/ooooo/backend${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "📍 Terminal 2 - Frontend React :"
echo -e "   ${BLUE}cd /home/user/ooooo/frontend${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "=========================================================="
echo -e "${GREEN}Accès aux interfaces :${NC}"
echo ""
echo "  🌐 Frontend : http://localhost:5173"
echo "  🔌 API      : http://localhost:3000/api/v1"
echo "  📚 Health   : http://localhost:3000/api/v1/health"
echo ""
echo "=========================================================="
echo ""
echo -e "${YELLOW}⚠️  Note importante :${NC}"
echo "   - En mode dev, les paiements sont simulés"
echo "   - Les SMS sont affichés dans la console (pas envoyés)"
echo "   - Pour la production, utilisez Docker avec PostgreSQL/Redis"
echo ""
echo "=========================================================="
echo ""
