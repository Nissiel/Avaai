"""
🔥 DIVINE TEST: Verify credential save persistence

This script tests if credentials ACTUALLY persist after save.
"""
import asyncio
import sys
from api.src.infrastructure.database.session import get_session_context
from api.src.infrastructure.persistence.models.user import User
from sqlalchemy import select

async def test_credential_persistence():
    print("🔬 Testing credential persistence...")
    
    async with get_session_context() as session:
        # Get first user (assuming one exists)
        result = await session.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ No user found in database")
            return False
            
        print(f"✅ Found user: {user.email}")
        print(f"   - Has Vapi key: {bool(user.vapi_api_key)}")
        print(f"   - Has Twilio SID: {bool(user.twilio_account_sid)}")
        print(f"   - Has Twilio token: {bool(user.twilio_auth_token)}")
        print(f"   - Has Twilio phone: {bool(user.twilio_phone_number)}")
        
        # Test save operation
        print("\n🧪 Testing save operation...")
        original_key = user.vapi_api_key
        test_key = "sk_test_divine_rule_1234567890"
        
        user.vapi_api_key = test_key
        await session.commit()
        await session.refresh(user)
        
        if user.vapi_api_key != test_key:
            print(f"❌ FAILED: Key not persisted after commit+refresh")
            print(f"   Expected: {test_key}")
            print(f"   Got: {user.vapi_api_key}")
            return False
            
        print(f"✅ Save successful: Key persisted after commit+refresh")
        
        # Restore original
        user.vapi_api_key = original_key
        await session.commit()
        print(f"✅ Restored original key")
        
        return True

if __name__ == "__main__":
    try:
        result = asyncio.run(test_credential_persistence())
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
