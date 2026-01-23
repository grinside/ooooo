#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║        ${GREEN}🚀 MAX IT TV AFFILIATION PLATFORM 🚀${BLUE}        ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

cd /home/user/ooooo

# Fonction pour tuer les processus à la sortie
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Arrêt des services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Services arrêtés${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Créer les dossiers de logs
mkdir -p logs

echo -e "${BLUE}📊 Démarrage des services...${NC}"
echo ""

# Lancer le Backend
echo -e "${YELLOW}🔧 Démarrage Backend API (port 3000)...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Vérifier si le backend a démarré
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend démarré (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Erreur démarrage backend${NC}"
    echo "Voir logs/backend.log pour détails"
    exit 1
fi

# Lancer le Frontend
echo -e "${YELLOW}🎨 Démarrage Frontend React (port 5173)...${NC}"
cd ../frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# Vérifier si le frontend a démarré
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend démarré (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Erreur démarrage frontend${NC}"
    echo "Voir logs/frontend.log pour détails"
    kill $BACKEND_PID
    exit 1
fi

cd ..

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║              ${GREEN}✅ SYSTÈME DÉMARRÉ !${BLUE}                   ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Accès aux interfaces :${NC}"
echo ""
echo -e "   ${BLUE}Frontend React :${NC}  http://localhost:5173"
echo -e "   ${BLUE}API Backend    :${NC}  http://localhost:3000/api/v1"
echo -e "   ${BLUE}Health Check   :${NC}  http://localhost:3000/api/v1/health"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Interfaces disponibles :${NC}"
echo ""
echo -e "   1. ${GREEN}Landing Client${NC}     → http://localhost:5173"
echo -e "   2. ${GREEN}Inscription Affilié${NC} → http://localhost:5173/affiliate/register"
echo -e "   3. ${GREEN}Login Affilié${NC}      → http://localhost:5173/affiliate/login"
echo -e "   4. ${GREEN}Admin Login${NC}        → http://localhost:5173/admin/login"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Compte Admin par défaut :${NC}"
echo -e "   Email    : ${GREEN}admin@maxittv.com${NC}"
echo -e "   Password : ${GREEN}Admin@123${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📊 Logs en temps réel :${NC}"
echo ""
echo -e "   Backend  : ${BLUE}tail -f logs/backend.log${NC}"
echo -e "   Frontend : ${BLUE}tail -f logs/frontend.log${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${RED}⚠️  Note : En mode dev, pas de base de données réelle${NC}"
echo -e "${YELLOW}   Pour tester, installez PostgreSQL ou utilisez Docker${NC}"
echo ""
echo -e "${GREEN}Appuyez sur Ctrl+C pour arrêter les services${NC}"
echo ""

# Afficher les logs en temps réel
tail -f logs/backend.log logs/frontend.log
