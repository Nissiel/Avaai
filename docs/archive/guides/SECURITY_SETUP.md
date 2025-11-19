# Guide de Configuration Sécurisée AVA

## 🔒 Problème : Clés API exposées sur GitHub

GitHub a bloqué le push car il a détecté des clés API dans le fichier `.env`. C'est une protection importante !

## ✅ Solution : Configuration Persistante et Sécurisée

### Méthode 1 : Script de Configuration Automatique (Recommandé)

```bash
# Dans le dossier AVA, lance le script interactif
./setup_env.sh
```

Ce script va :
- Te demander toutes tes clés API de manière sécurisée
- Créer le fichier `.env` automatiquement
- Optionnellement ajouter les variables à ton profil shell (`~/.zshrc`)

### Méthode 2 : Configuration Manuelle

#### Étape 1 : Copier le template
```bash
cp .env.example .env
```

#### Étape 2 : Éditer avec tes vraies valeurs
```bash
nano .env  # ou ton éditeur préféré
```

#### Étape 3 : Ajouter à ton profil shell (optionnel)
```bash
# Ajoute ces lignes à ~/.zshrc pour persistance
echo 'export OPENAI_API_KEY="ta-clé-ici"' >> ~/.zshrc
echo 'export TWILIO_ACCOUNT_SID="ton-sid-ici"' >> ~/.zshrc
echo 'export TWILIO_AUTH_TOKEN="ton-token-ici"' >> ~/.zshrc
echo 'export NGROK_AUTH_TOKEN="ton-ngrok-token"' >> ~/.zshrc

# Recharger le profil
source ~/.zshrc
```

### Méthode 3 : Variables d'Environnement Système (macOS)

#### Création d'un script de démarrage
```bash
# Créer un script dans ~/bin/
mkdir -p ~/bin
cat > ~/bin/ava-env.sh << 'EOF'
#!/bin/bash
export OPENAI_API_KEY="ta-clé-openai"
export TWILIO_ACCOUNT_SID="ton-twilio-sid"
export TWILIO_AUTH_TOKEN="ton-twilio-token"
export NGROK_AUTH_TOKEN="ton-ngrok-token"
EOF

chmod +x ~/bin/ava-env.sh
```

#### Ajouter au profil shell
```bash
echo 'source ~/bin/ava-env.sh' >> ~/.zshrc
```

## 🚀 Usage Quotidien

### Option A : Variables dans le profil shell
Une fois configuré dans `~/.zshrc`, tes variables seront disponibles à chaque ouverture de terminal :
```bash
cd /chemin/vers/ava
./start.sh  # Les variables sont déjà chargées !
```

### Option B : Source manuel à chaque session
```bash
cd /chemin/vers/ava
source .env  # Charge les variables pour cette session
./start.sh
```

### Option C : Script tout-en-un
```bash
cd /chemin/vers/ava
./setup_env.sh  # Configuration initiale (une seule fois)
./start.sh      # Démarrage normal
```

## 🔐 Sécurité

### Fichiers Protégés (dans .gitignore)
- `.env` - Tes vraies clés API
- `.env.*` - Tous les variants d'environnement
- `*.env` - Tous les fichiers d'environnement

### Fichiers Sûrs (dans Git)
- `.env.example` - Template sans vraies valeurs
- `setup_env.sh` - Script de configuration
- `.gitignore` - Protection des secrets

## 🛠️ Dépannage

### Si les variables ne se chargent pas :
```bash
# Vérifier que le fichier .env existe
ls -la .env

# Vérifier le contenu (attention aux secrets!)
head -5 .env

# Recharger le profil shell
source ~/.zshrc

# Test des variables
echo $OPENAI_API_KEY
```

### Si le script setup_env.sh ne fonctionne pas :
```bash
# Vérifier les permissions
ls -la setup_env.sh

# Rendre exécutable si nécessaire
chmod +x setup_env.sh

# Lancer avec bash si problème
bash setup_env.sh
```

## 🎯 Recommandation Finale

**Pour une configuration une fois pour toutes :**
1. Lance `./setup_env.sh`
2. Choisis d'ajouter les variables à `~/.zshrc`
3. Redémarre ton terminal
4. Désormais, `./start.sh` fonctionnera directement !

Tes clés seront sécurisées localement et jamais exposées sur GitHub. 🔒✅