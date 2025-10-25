# 🔥 GUIDE DIVINE - Comment changer la voix d'AVA

## ✅ OUI, tes changements seront pris en compte !

Voici comment faire :

### 1. Va dans Studio Settings
- Ouvre l'interface web
- Va dans **Dashboard > Settings > Studio**

### 2. Change la voix
Dans la section **Voice & Personality**, tu peux changer :

**🎙️ Voix françaises disponibles :**
- **Charlotte** (XB0fDUnXU5powFXDhCwa) - Femme, chaleureuse, claire
- **Bella** (EXAVITQu4vr4xnSDxMaL) - Femme, douce, rassurante ⭐ **RECOMMANDÉE**
- **Thomas** (VR6AewLTigWG4xSOukaG) - Homme, professionnel, mature
- **Antoine** (ErXwobaYiN019PkySvjV) - Homme, dynamique, jeune

**💡 Si tu as un problème d'accent :**
1. Change pour **Bella** ou **Thomas** (voix premium)
2. Réduis la vitesse à **0.9x** ou **1.0x**
3. Change le "First Message" en français pur

### 3. Ajuste les autres paramètres

**🤖 Modèle IA :**
- **GPT-4o** ⭐ (meilleur pour français + téléphone)
- GPT-4 (très bon mais plus lent)
- GPT-3.5-turbo (rapide mais moins précis)

**🌡️ Temperature :**
- 0.7 = Équilibré (recommandé)
- 0.5 = Plus précis, moins naturel
- 0.9 = Plus créatif, moins prévisible

**🎚️ Voice Speed :**
- 0.9x = Plus lent (meilleure clarté)
- 1.0x = Normal ⭐ (recommandé)
- 1.2x = Plus rapide (peut créer accent)

### 4. Modifie le System Prompt

Exemple parfait pour français :
```
Tu es AVA, une assistante professionnelle française.

RÈGLES :
- Parle en français NATIF (pas d'accent)
- Sois concise - une phrase à la fois
- NE RÉPÈTE JAMAIS ce que tu viens de dire
- Demande le nom dans les 2 premiers échanges
- Reste chaleureuse mais professionnelle
```

### 5. Clique "Save & Sync to Vapi"

**TU VERRAS** :
1. Un panneau orange te montrant ce qui sera envoyé
2. Un toast de confirmation avec les détails :
   ```
   🔥 Assistant Updated Successfully!
   ✅ Voice: 11labs @ 1.0x
   ✅ Model: gpt-4o (temp=0.7)
   ✅ Max Tokens: 200
   ```

### 6. Teste immédiatement

Appelle ton numéro Vapi :
- **+19787182628**

Les changements sont **INSTANTANÉS** !

## 🔍 Debug

Si ça ne marche toujours pas :

1. **Vérifie le badge** en haut :
   - Tu dois voir "Synced with Vapi"
   - ID: 98d71a30...

2. **Regarde les logs backend** :
   - Terminal doit afficher :
   ```
   🎯 DIVINE: Attempting to UPDATE existing assistant...
   ✅ Found existing assistant: Ava Assistant
   🔥 DIVINE UPDATE: Updating assistant...
   ✅ Successfully UPDATED assistant
   ```

3. **Si ça crée un nouvel assistant** :
   - Ça veut dire que l'ID n'est pas le bon
   - Cours le script : `./divine_update.sh`

## 💡 Astuces

**Pour un français PARFAIT :**
- Voix : **Bella** (la meilleure !)
- Speed : **0.9x** ou **1.0x**
- Model : **GPT-4o**
- Temperature : **0.7**
- Prompt : 100% en français

**Pour éviter les répétitions :**
- Ajoute dans le prompt :
  ```
  ⚠️ CRITICAL: NEVER repeat yourself
  NE RÉPÈTE JAMAIS la même chose
  ```

---

## 🎯 TL;DR

1. Ouvre Studio Settings
2. Change la voix pour **Bella** + speed **1.0x**
3. Change le modèle pour **GPT-4o**
4. Mets le prompt en français pur
5. Clique "Save & Sync to Vapi"
6. Appelle immédiatement pour tester

**Les changements sont IMMÉDIATS !** ⚡
