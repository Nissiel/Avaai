#!/usr/bin/env python3
"""
Script de test complet pour Sarah.AI
Vérifie que tous les composants fonctionnent parfaitement
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_health():
    """Test du health check"""
    try:
        response = requests.get("http://localhost:8081/healthz", timeout=5)
        if response.status_code == 200 and response.json().get("status") == "ok":
            print("✅ Health Check: OK")
            return True
        else:
            print(f"❌ Health Check: Erreur {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check: Exception {e}")
        return False

def test_public_url():
    """Test de l'endpoint public URL"""
    try:
        response = requests.get("http://localhost:8081/public-url", timeout=5)
        if response.status_code == 200:
            data = response.json()
            public_url = data.get("publicUrl", "")
            print(f"✅ Public URL: {public_url}")
            return True
        else:
            print(f"❌ Public URL: Erreur {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Public URL: Exception {e}")
        return False

def test_twiml():
    """Test de la génération TwiML"""
    try:
        response = requests.get("http://localhost:8081/twiml", timeout=5)
        if response.status_code == 200 and "Stream url=" in response.text:
            print("✅ TwiML Generation: OK")
            return True
        else:
            print(f"❌ TwiML: Erreur {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ TwiML: Exception {e}")
        return False

def test_config():
    """Test de la configuration"""
    config_items = [
        ("OPENAI_API_KEY", "Clé OpenAI"),
        ("TWILIO_ACCOUNT_SID", "Twilio SID"),
        ("TWILIO_AUTH_TOKEN", "Twilio Token"),
        ("TWILIO_INBOUND_NUMBER", "Numéro Twilio"),
        ("PUBLIC_BASE_URL", "URL Ngrok")
    ]
    
    all_good = True
    for key, desc in config_items:
        value = os.getenv(key)
        if value:
            print(f"✅ {desc}: Configuré")
        else:
            print(f"❌ {desc}: Manquant")
            all_good = False
    
    return all_good

def main():
    print("🧪 TESTS COMPLETS SARAH.AI")
    print("=" * 50)
    
    tests = [
        ("Configuration", test_config),
        ("Health Check", test_health),
        ("Public URL", test_public_url),
        ("TwiML Generation", test_twiml),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Test: {test_name}")
        result = test_func()
        results.append(result)
    
    print("\n" + "=" * 50)
    print("📋 RÉSUMÉ DES TESTS:")
    
    if all(results):
        print("🎉 TOUS LES TESTS PASSENT!")
        print("")
        print("🚀 Sarah.AI est PRÊTE!")
        print("📞 Numéro d'appel: +19787182628")
        print("🌐 Interface: http://localhost:3000")
        print("🔗 API: http://localhost:8081")
        
        # Instructions finales
        print("\n📝 POUR LANCER COMPLÈTEMENT:")
        print("1. Serveur déjà lancé ✅")
        print("2. Lancer: eval \"$(/opt/homebrew/bin/brew shellenv)\" && /opt/homebrew/bin/ngrok http 8081")
        print("3. (Optionnel) Lancer frontend: cd webapp && npm run dev")
        print("4. Appeler +19787182628 pour tester!")
        
    else:
        print("❌ CERTAINS TESTS ÉCHOUENT")
        print("Vérifiez la configuration et les services.")
    
    return all(results)

if __name__ == "__main__":
    main()