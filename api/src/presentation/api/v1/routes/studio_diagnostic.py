"""
🔬 DIVINE DIAGNOSTIC ENDPOINT
Vérification complète de la synchronisation Vapi
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from api.src.infrastructure.external.vapi_client import VapiClient
from .studio_config import get_current_config

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/studio/diagnostic")
async def diagnostic_vapi_sync() -> Dict[str, Any]:
    """
    🔬 DIAGNOSTIC COMPLET DE LA SYNCHRONISATION VAPI
    
    Compare la config locale avec l'assistant Vapi actuel
    Identifie les différences et problèmes de sync
    """
    try:
        config = get_current_config()  # ✨ Use getter function instead of direct import
        
        # 1️⃣ Vérifier la config locale
        local_config = {
            "assistantId": config.vapiAssistantId,
            "organizationName": config.organizationName,
            "voiceProvider": config.voiceProvider,
            "voiceId": config.voiceId,
            "voiceSpeed": config.voiceSpeed,
            "firstMessage": config.firstMessage,
            "aiModel": config.aiModel,
            "aiTemperature": config.aiTemperature,
            "aiMaxTokens": config.aiMaxTokens,
            "systemPrompt": config.systemPrompt[:200] + "..." if len(config.systemPrompt) > 200 else config.systemPrompt,
            "askForName": config.askForName,
            "askForEmail": config.askForEmail,
            "askForPhone": config.askForPhone,
        }
        
        # 2️⃣ Récupérer l'assistant actuel de Vapi
        client = VapiClient()
        vapi_assistant = None
        vapi_error = None
        
        if config.vapiAssistantId:
            try:
                vapi_assistant = await client.get_assistant(config.vapiAssistantId)
            except Exception as e:
                vapi_error = str(e)
                logger.error(f"❌ Erreur récupération assistant Vapi: {e}")
        
        # 3️⃣ Récupérer les numéros de téléphone
        phone_numbers = []
        phone_error = None
        try:
            phones = await client.list_phone_numbers()
            for phone in phones:
                phone_numbers.append({
                    "id": phone.get("id"),
                    "number": phone.get("number"),
                    "assistantId": phone.get("assistantId"),
                    "matchesConfig": phone.get("assistantId") == config.vapiAssistantId
                })
        except Exception as e:
            phone_error = str(e)
            logger.error(f"❌ Erreur récupération phone numbers: {e}")
        
        # 4️⃣ Comparer les configurations
        differences = []
        if vapi_assistant:
            # Comparer voice
            vapi_voice = vapi_assistant.get("voice", {})
            if vapi_voice.get("provider") != config.voiceProvider:
                differences.append({
                    "field": "voiceProvider",
                    "local": config.voiceProvider,
                    "vapi": vapi_voice.get("provider")
                })
            if vapi_voice.get("voiceId") != config.voiceId:
                differences.append({
                    "field": "voiceId",
                    "local": config.voiceId,
                    "vapi": vapi_voice.get("voiceId")
                })
            if vapi_voice.get("speed") != config.voiceSpeed:
                differences.append({
                    "field": "voiceSpeed",
                    "local": config.voiceSpeed,
                    "vapi": vapi_voice.get("speed")
                })
            
            # Comparer model
            vapi_model = vapi_assistant.get("model", {})
            if vapi_model.get("model") != config.aiModel:
                differences.append({
                    "field": "aiModel",
                    "local": config.aiModel,
                    "vapi": vapi_model.get("model")
                })
            if vapi_model.get("temperature") != config.aiTemperature:
                differences.append({
                    "field": "aiTemperature",
                    "local": config.aiTemperature,
                    "vapi": vapi_model.get("temperature")
                })
            if vapi_model.get("maxTokens") != config.aiMaxTokens:
                differences.append({
                    "field": "aiMaxTokens",
                    "local": config.aiMaxTokens,
                    "vapi": vapi_model.get("maxTokens")
                })
            
            # Comparer system prompt
            vapi_messages = vapi_model.get("messages", [])
            vapi_system_prompt = None
            for msg in vapi_messages:
                if msg.get("role") == "system":
                    vapi_system_prompt = msg.get("content")
                    break
            
            if vapi_system_prompt != config.systemPrompt:
                differences.append({
                    "field": "systemPrompt",
                    "local": config.systemPrompt[:100] + "...",
                    "vapi": (vapi_system_prompt[:100] + "...") if vapi_system_prompt else None
                })
            
            # Comparer firstMessage
            if vapi_assistant.get("firstMessage") != config.firstMessage:
                differences.append({
                    "field": "firstMessage",
                    "local": config.firstMessage,
                    "vapi": vapi_assistant.get("firstMessage")
                })
        
        # 5️⃣ Résultat du diagnostic
        return {
            "status": "success",
            "timestamp": str(__import__("datetime").datetime.now()),
            "localConfig": local_config,
            "vapiAssistant": {
                "found": vapi_assistant is not None,
                "id": vapi_assistant.get("id") if vapi_assistant else None,
                "name": vapi_assistant.get("name") if vapi_assistant else None,
                "error": vapi_error,
                "data": vapi_assistant if vapi_assistant else None
            },
            "phoneNumbers": {
                "count": len(phone_numbers),
                "numbers": phone_numbers,
                "error": phone_error,
                "allMatchConfig": all(p.get("matchesConfig") for p in phone_numbers) if phone_numbers else False
            },
            "differences": {
                "count": len(differences),
                "details": differences
            },
            "recommendations": _generate_recommendations(differences, phone_numbers, vapi_assistant, config)
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur diagnostic: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Diagnostic error: {str(e)}")


def _generate_recommendations(differences, phone_numbers, vapi_assistant, config) -> list[str]:
    """Génère des recommandations basées sur le diagnostic"""
    recs = []
    
    if not config.vapiAssistantId:
        recs.append("⚠️ Aucun assistantId configuré - effectuez une synchronisation")
    
    if not vapi_assistant:
        recs.append("❌ Assistant introuvable sur Vapi - créez-en un nouveau via sync")
    
    if differences:
        recs.append(f"⚠️ {len(differences)} différence(s) détectée(s) - re-synchronisez la config")
    
    if phone_numbers:
        unmatched = [p for p in phone_numbers if not p.get("matchesConfig")]
        if unmatched:
            recs.append(f"⚠️ {len(unmatched)} numéro(s) non lié(s) à l'assistant configuré")
    else:
        recs.append("⚠️ Aucun numéro de téléphone trouvé")
    
    if not differences and vapi_assistant and all(p.get("matchesConfig") for p in phone_numbers):
        recs.append("✅ Configuration parfaitement synchronisée !")
    
    return recs
