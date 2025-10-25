#!/usr/bin/env python3
"""
🔥 DIVINE FORCE UPDATE SCRIPT
Force update the existing Vapi assistant with correct settings
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from api.src.infrastructure.external.vapi_client import VapiClient
from api.src.presentation.api.v1.routes.studio_config import get_current_config

async def force_update():
    """Force update the existing assistant"""
    
    # Get current config
    config = get_current_config()
    
    print("🔥 DIVINE FORCE UPDATE")
    print("=" * 60)
    print(f"📋 Organization: {config.organizationName}")
    print(f"🆔 Assistant ID: {config.vapiAssistantId}")
    print(f"🎙️ Voice: {config.voiceProvider}/{config.voiceId} @ {config.voiceSpeed}x")
    print(f"🤖 Model: {config.aiModel} (temp={config.aiTemperature})")
    print("=" * 60)
    
    if not config.vapiAssistantId:
        print("❌ ERROR: No assistant ID found!")
        print("   Please set vapiAssistantId in the config first")
        return
    
    # Create client
    client = VapiClient()
    
    # Build system prompt
    system_prompt = (
        "Tu es AVA, une assistante professionnelle française. "
        "Sois concise et claire dans tes réponses. "
        "CRITIQUE: Demande le nom de l'appelant dans ta première ou deuxième réponse. "
        "Écoute attentivement, comprends le contexte rapidement, et réponds promptement. "
        "⚠️ CRITICAL: NEVER repeat yourself. If you already said something, move on. "
        "NE RÉPÈTE JAMAIS la même chose. Passe directement à la suite."
    )
    
    if config.askForName:
        system_prompt += "\n\nCRITICAL: You MUST ask for the caller's name within the first 2 exchanges."
    
    if config.guidelines:
        system_prompt += f"\n\nGuidelines: {config.guidelines}"
    
    print("\n🔄 Updating assistant...")
    print(f"📝 System Prompt: {system_prompt[:100]}...")
    
    try:
        # Force update
        updated = await client.update_assistant(
            config.vapiAssistantId,
            name=f"{config.organizationName} Assistant",
            voice_provider=config.voiceProvider,
            voice_id=config.voiceId,
            voice_speed=config.voiceSpeed,
            first_message=config.firstMessage,
            model_provider="openai",
            model=config.aiModel,
            temperature=config.aiTemperature,
            max_tokens=config.aiMaxTokens,
            system_prompt=system_prompt,
            metadata={
                "organization": config.organizationName,
                "persona": config.persona,
                "tone": config.tone,
                "language": config.language,
                "voice_speed": config.voiceSpeed,
            }
        )
        
        print("\n✅ SUCCESS!")
        print(f"   🆔 Assistant ID: {updated['id']}")
        print(f"   📛 Name: {updated.get('name')}")
        print(f"   🎙️ Voice: {updated.get('voice', {}).get('provider')}/{updated.get('voice', {}).get('voiceId')}")
        print(f"   🤖 Model: {updated.get('model', {}).get('model')}")
        print(f"   🌡️ Temperature: {updated.get('model', {}).get('temperature')}")
        print(f"   💬 First Message: {updated.get('firstMessage')}")
        
        # Get phone numbers and reassign
        print("\n📞 Checking phone numbers...")
        phones = await client.list_phone_numbers()
        for phone in phones:
            phone_id = phone.get("id")
            phone_number = phone.get("number", "unknown")
            current_assistant = phone.get("assistantId")
            
            if current_assistant != config.vapiAssistantId:
                print(f"   🔄 Reassigning {phone_number} to assistant...")
                await client.assign_phone_number(phone_id, config.vapiAssistantId)
                print(f"   ✅ {phone_number} reassigned")
            else:
                print(f"   ✅ {phone_number} already assigned")
        
        print("\n" + "=" * 60)
        print("🎉 DIVINE UPDATE COMPLETE!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(force_update())
