#!/usr/bin/env python3
"""
🔥 DIVINE FORCE UPDATE SCRIPT - Simplified
Force update the existing Vapi assistant with correct settings
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def force_update():
    """Force update the existing assistant"""
    
    # Import after loading env
    from api.src.infrastructure.external.vapi_client import VapiClient
    
    ASSISTANT_ID = "98d71a30-c55c-43dd-8d64-1af9cf8b57cb"
    
    print("🔥 DIVINE FORCE UPDATE")
    print("=" * 60)
    print(f"🆔 Assistant ID: {ASSISTANT_ID}")
    print("=" * 60)
    
    # Create client
    client = VapiClient()
    
    # Perfect French system prompt - NO REPETITION
    system_prompt = """Tu es AVA, une assistante professionnelle française.

RÈGLES CRITIQUES :
1. ⚠️ NE RÉPÈTE JAMAIS ce que tu viens de dire
2. Sois CONCISE - une seule phrase courte à la fois
3. Écoute attentivement et réponds DIRECTEMENT à la question
4. Parle naturellement en FRANÇAIS NATIF (pas d'accent)
5. Demande le nom dans les 2 premiers échanges

COMPORTEMENT :
- Si tu as déjà dit quelque chose, passe à la suite
- Ne redemande JAMAIS la même information
- Reste professionnelle mais chaleureuse
- Réponds vite et efficacement"""
    
    first_message = "Bonjour ! Je suis AVA. Puis-je avoir votre nom s'il vous plaît ?"
    
    print("\n🔄 Updating assistant with DIVINE settings...")
    print(f"   🎙️ Voice: Charlotte (XB0fDUnXU5powFXDhCwa) @ 1.0x")
    print(f"   🤖 Model: GPT-4o (temp=0.7, max=200)")
    print(f"   💬 First Message: {first_message}")
    
    try:
        # Force update
        updated = await client.update_assistant(
            ASSISTANT_ID,
            name="Ava Assistant (DIVINE)",
            voice_provider="11labs",
            voice_id="XB0fDUnXU5powFXDhCwa",  # Charlotte - French
            voice_speed=1.0,  # Normal speed
            first_message=first_message,
            model_provider="openai",
            model="gpt-4o",  # Best for French
            temperature=0.7,  # Natural but focused
            max_tokens=200,  # Reasonable length
            system_prompt=system_prompt,
            metadata={
                "organization": "Ava",
                "language": "fr-FR",
                "version": "divine-v2",
                "updated": "2025-10-25"
            }
        )
        
        print("\n✅ SUCCESS!")
        print(f"   🆔 ID: {updated['id']}")
        print(f"   📛 Name: {updated.get('name')}")
        
        voice = updated.get('voice', {})
        print(f"   🎙️ Voice: {voice.get('provider')}/{voice.get('voiceId')} @ {voice.get('speed', 1.0)}x")
        
        model = updated.get('model', {})
        print(f"   🤖 Model: {model.get('model')} (temp={model.get('temperature')})")
        
        print(f"   💬 First: {updated.get('firstMessage')[:50]}...")
        
        # Reassign phone numbers
        print("\n📞 Reassigning phone numbers...")
        phones = await client.list_phone_numbers()
        
        for phone in phones:
            phone_id = phone.get("id")
            phone_number = phone.get("number", "unknown")
            current_assistant = phone.get("assistantId")
            
            if current_assistant != ASSISTANT_ID:
                print(f"   🔄 Reassigning {phone_number}...")
                await client.assign_phone_number(phone_id, ASSISTANT_ID)
                print(f"   ✅ {phone_number} → {ASSISTANT_ID[:8]}...")
            else:
                print(f"   ✅ {phone_number} already assigned")
        
        print("\n" + "=" * 60)
        print("🎉 DIVINE UPDATE COMPLETE!")
        print("=" * 60)
        print("\n🧪 TEST NOW:")
        print("   1. Call your Vapi number")
        print("   2. AVA should speak PERFECT French with Charlotte voice")
        print("   3. She should NOT repeat herself")
        print("   4. She should understand French perfectly")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(force_update())
