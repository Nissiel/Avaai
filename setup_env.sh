#!/bin/bash

# Script de configuration automatique des variables d'environnement AVA
# Usage: source setup_env.sh

echo "🔧 Configuration des variables d'environnement AVA"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour demander une valeur avec validation
ask_for_value() {
    local var_name=$1
    local prompt_message=$2
    local default_value=$3
    local is_secret=$4
    
    echo -e "${BLUE}${prompt_message}${NC}"
    if [ ! -z "$default_value" ]; then
        echo -e "${YELLOW}Valeur actuelle: ${default_value}${NC}"
        echo -n "Nouvelle valeur (Entrée pour garder actuelle): "
    else
        echo -n "Valeur: "
    fi
    
    if [ "$is_secret" = "true" ]; then
        read -s user_input
        echo
    else
        read user_input
    fi
    
    if [ -z "$user_input" ] && [ ! -z "$default_value" ]; then
        echo "$default_value"
    else
        echo "$user_input"
    fi
}

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Fichier .env non trouvé, création depuis .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        touch .env
    fi
fi

# Lire les valeurs actuelles si elles existent
source .env 2>/dev/null || true

echo -e "${GREEN}=== Configuration OpenAI ===${NC}"
OPENAI_API_KEY=$(ask_for_value "OPENAI_API_KEY" "Clé API OpenAI (commence par sk-...):" "$OPENAI_API_KEY" "true")

echo -e "\n${GREEN}=== Configuration Twilio ===${NC}"
TWILIO_ACCOUNT_SID=$(ask_for_value "TWILIO_ACCOUNT_SID" "Account SID Twilio:" "$TWILIO_ACCOUNT_SID" "true")
TWILIO_AUTH_TOKEN=$(ask_for_value "TWILIO_AUTH_TOKEN" "Auth Token Twilio:" "$TWILIO_AUTH_TOKEN" "true")
TWILIO_PHONE_NUMBER=$(ask_for_value "TWILIO_PHONE_NUMBER" "Numéro de téléphone Twilio (+1234567890):" "$TWILIO_PHONE_NUMBER" "false")

echo -e "\n${GREEN}=== Configuration AVA ===${NC}"
AVA_NAME=$(ask_for_value "AVA_NAME" "Nom de l'assistante:" "${AVA_NAME:-AVA}" "false")
AVA_LANGUAGE=$(ask_for_value "AVA_LANGUAGE" "Langue (fr-FR, en-US, etc.):" "${AVA_LANGUAGE:-fr-FR}" "false")

echo -e "\n${GREEN}=== Configuration Ngrok ===${NC}"
NGROK_AUTH_TOKEN=$(ask_for_value "NGROK_AUTH_TOKEN" "Token d'authentification Ngrok:" "$NGROK_AUTH_TOKEN" "true")

echo -e "\n${GREEN}=== Configuration Email (optionnel) ===${NC}"
read -p "Configurer l'envoi d'emails ? (y/N): " configure_email
if [[ $configure_email =~ ^[Yy]$ ]]; then
    EMAIL_USERNAME=$(ask_for_value "EMAIL_USERNAME" "Email d'envoi:" "$EMAIL_USERNAME" "false")
    EMAIL_PASSWORD=$(ask_for_value "EMAIL_PASSWORD" "Mot de passe d'application email:" "$EMAIL_PASSWORD" "true")
    EMAIL_TO=$(ask_for_value "EMAIL_TO" "Email de réception des résumés:" "${EMAIL_TO:-$EMAIL_USERNAME}" "false")
fi

# Écrire le fichier .env
cat > .env << EOF
# Configuration AVA - Généré automatiquement le $(date)

# OpenAI Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# Twilio Configuration
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER

# AVA Configuration
AVA_NAME=$AVA_NAME
AVA_GREETING=Bonjour, vous êtes avec $AVA_NAME, votre assistante personnelle en français. Comment puis-je vous aider aujourd'hui ?
AVA_LANGUAGE=$AVA_LANGUAGE
AVA_PERSONALITY=Assistante virtuelle française, professionnelle mais chaleureuse, experte en communication

# Ngrok Configuration
NGROK_AUTH_TOKEN=$NGROK_AUTH_TOKEN

# Email Configuration
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=$EMAIL_USERNAME
EMAIL_PASSWORD=$EMAIL_PASSWORD
EMAIL_FROM=$EMAIL_USERNAME
EMAIL_TO=$EMAIL_TO

# Configuration Serveur
SERVER_HOST=0.0.0.0
SERVER_PORT=8081
DEBUG_MODE=true
EOF

echo -e "\n${GREEN}✅ Configuration sauvegardée dans .env${NC}"
echo -e "${YELLOW}⚠️  Note: Le fichier .env est exclu de Git pour la sécurité${NC}"

# Optionnel: Ajouter les variables au profil shell pour persistance
read -p "Voulez-vous ajouter ces variables à votre profil shell (~/.zshrc) ? (y/N): " add_to_profile
if [[ $add_to_profile =~ ^[Yy]$ ]]; then
    echo "" >> ~/.zshrc
    echo "# Variables d'environnement AVA - Ajouté le $(date)" >> ~/.zshrc
    echo "export OPENAI_API_KEY=\"$OPENAI_API_KEY\"" >> ~/.zshrc
    echo "export TWILIO_ACCOUNT_SID=\"$TWILIO_ACCOUNT_SID\"" >> ~/.zshrc
    echo "export TWILIO_AUTH_TOKEN=\"$TWILIO_AUTH_TOKEN\"" >> ~/.zshrc
    echo "export NGROK_AUTH_TOKEN=\"$NGROK_AUTH_TOKEN\"" >> ~/.zshrc
    echo -e "${GREEN}✅ Variables ajoutées à ~/.zshrc${NC}"
    echo -e "${YELLOW}🔄 Redémarrez votre terminal ou tapez: source ~/.zshrc${NC}"
fi

echo -e "\n${BLUE}🚀 Configuration terminée ! Vous pouvez maintenant lancer AVA avec: ./start.sh${NC}"