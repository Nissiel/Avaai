#!/usr/bin/env node
/**
 * ============================================================================
 * AVA DIVINE SETUP SCRIPT
 * ============================================================================
 * Interactive setup wizard for first-time configuration
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Print header
function printHeader() {
  console.log('\n');
  console.log(colors.cyan + colors.bright + '╔═══════════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.cyan + colors.bright + '║                                                               ║' + colors.reset);
  console.log(colors.cyan + colors.bright + '║           🚀 AVA - Divine Setup Wizard 🚀                    ║' + colors.reset);
  console.log(colors.cyan + colors.bright + '║                                                               ║' + colors.reset);
  console.log(colors.cyan + colors.bright + '╚═══════════════════════════════════════════════════════════════╝' + colors.reset);
  console.log('\n');
}

// Print section
function printSection(title) {
  console.log('\n' + colors.bright + colors.blue + '━'.repeat(65) + colors.reset);
  console.log(colors.bright + colors.blue + title + colors.reset);
  console.log(colors.bright + colors.blue + '━'.repeat(65) + colors.reset + '\n');
}

// Print success
function printSuccess(message) {
  console.log(colors.green + '✅ ' + message + colors.reset);
}

// Print error
function printError(message) {
  console.log(colors.red + '❌ ' + message + colors.reset);
}

// Print info
function printInfo(message) {
  console.log(colors.yellow + '💡 ' + message + colors.reset);
}

// Main setup function
async function main() {
  printHeader();

  console.log('Bienvenue dans le setup de AVA ! 🎉\n');
  console.log('Ce wizard va vous guider pour configurer votre environnement.\n');
  console.log(colors.bright + 'Prérequis :' + colors.reset);
  console.log('  • Node.js >= 18.0.0');
  console.log('  • Compte Vapi.ai (gratuit sur https://vapi.ai)');
  console.log('  • Compte Twilio (optionnel pour numéros)\n');

  const proceed = await question('Voulez-vous continuer ? (o/n) : ');
  if (proceed.toLowerCase() !== 'o' && proceed.toLowerCase() !== 'oui') {
    console.log('\nSetup annulé. À bientôt ! 👋\n');
    rl.close();
    return;
  }

  // Step 1: Check Node version
  printSection('📋 Étape 1 : Vérification de l\'environnement');
  try {
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.split('.')[0].substring(1));
    if (major < 18) {
      printError(`Node.js ${nodeVersion} détecté. Version >= 18.0.0 requise.`);
      printInfo('Veuillez installer Node.js 18+ depuis https://nodejs.org');
      rl.close();
      return;
    }
    printSuccess(`Node.js ${nodeVersion} détecté ✓`);
  } catch (error) {
    printError('Impossible de vérifier la version de Node.js');
    rl.close();
    return;
  }

  // Step 2: Create .env file
  printSection('🔑 Étape 2 : Configuration des variables d\'environnement');

  const envPath = path.join(__dirname, '..', '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '..', '.env.example');

  if (fs.existsSync(envPath)) {
    console.log('Un fichier .env existe déjà.\n');
    const overwrite = await question('Voulez-vous le reconfigurer ? (o/n) : ');
    if (overwrite.toLowerCase() !== 'o' && overwrite.toLowerCase() !== 'oui') {
      printInfo('Configuration .env conservée');
    } else {
      await configureEnv(envPath, envExamplePath);
    }
  } else {
    await configureEnv(envPath, envExamplePath);
  }

  // Step 3: Install dependencies
  printSection('📦 Étape 3 : Installation des dépendances');

  const install = await question('Installer les dépendances npm ? (o/n) : ');
  if (install.toLowerCase() === 'o' || install.toLowerCase() === 'oui') {
    try {
      console.log('\nInstallation en cours... (peut prendre quelques minutes)');
      execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
      printSuccess('Dépendances installées avec succès !');
    } catch (error) {
      printError('Échec de l\'installation des dépendances');
      console.log('\nVous pouvez les installer manuellement avec : npm install\n');
    }
  } else {
    printInfo('Vous devrez installer les dépendances manuellement : npm install');
  }

  // Step 4: Final instructions
  printSection('🎉 Étape 4 : C\'est prêt !');

  console.log('Votre environnement AVA est configuré !\n');
  console.log(colors.bright + 'Prochaines étapes :' + colors.reset + '\n');
  console.log('  1. Lancez le serveur de développement :');
  console.log(colors.cyan + '     npm run dev' + colors.reset + '\n');
  console.log('  2. Ouvrez votre navigateur :');
  console.log(colors.cyan + '     http://localhost:3000/onboarding' + colors.reset + '\n');
  console.log('  3. Suivez le wizard pour créer votre première AVA !\n');
  console.log(colors.bright + 'Documentation complète :' + colors.reset + ' README.md\n');
  console.log(colors.magenta + '✨ Bonne création d\'AVA ! ✨' + colors.reset + '\n');

  rl.close();
}

// Configure .env file
async function configureEnv(envPath, envExamplePath) {
  console.log('Configuration du fichier .env...\n');

  // Read example file
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf-8');
  }

  console.log(colors.yellow + '🔐 Clés Vapi.ai requises' + colors.reset);
  console.log('   Obtenez-les sur : https://dashboard.vapi.ai/api-keys\n');

  const vapiApiKey = await question('VAPI_API_KEY : ');
  const vapiPublicKey = await question('VAPI_PUBLIC_KEY : ');

  console.log('\n' + colors.yellow + '🔒 Webhook secret (optionnel)' + colors.reset);
  const vapiWebhookSecret = await question('VAPI_WEBHOOK_SECRET (Enter pour ignorer) : ');

  // Update env content
  envContent = envContent.replace(
    'VAPI_API_KEY=your-vapi-api-key-here',
    `VAPI_API_KEY=${vapiApiKey}`
  );
  envContent = envContent.replace(
    'VAPI_PUBLIC_KEY=your-vapi-public-key-here',
    `VAPI_PUBLIC_KEY=${vapiPublicKey}`
  );
  if (vapiWebhookSecret) {
    envContent = envContent.replace(
      'VAPI_WEBHOOK_SECRET=your-vapi-webhook-secret',
      `VAPI_WEBHOOK_SECRET=${vapiWebhookSecret}`
    );
  }

  // Write .env file
  fs.writeFileSync(envPath, envContent, 'utf-8');
  printSuccess('Fichier .env créé avec succès !');
}

// Run main
main().catch((error) => {
  printError('Une erreur est survenue : ' + error.message);
  rl.close();
  process.exit(1);
});
