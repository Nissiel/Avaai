#!/bin/bash
# Test de connexion Supabase depuis local

echo "🔍 Test connexion Supabase Pooler..."

# Test avec asyncpg (comme FastAPI)
python3 << 'PYTHON'
import asyncio
import asyncpg

async def test_pooler():
    try:
        print("Testing pooler connection...")
        conn = await asyncpg.connect(
            host='aws-0-eu-central-1.pooler.supabase.com',
            port=6543,
            user='postgres.zymlhofsintkycruwznc',
            password='Bichon55!!??',
            database='postgres',
            statement_cache_size=0,
            timeout=10
        )
        version = await conn.fetchval('SELECT version()')
        print(f"✅ SUCCESS! Connected to: {version[:50]}...")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

success = asyncio.run(test_pooler())
exit(0 if success else 1)
PYTHON

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ POOLER CONNECTION WORKS!"
    echo ""
    echo "URL à mettre sur Render:"
    echo "postgresql+asyncpg://postgres.zymlhofsintkycruwznc:Bichon55!!??@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
else
    echo ""
    echo "❌ Pooler connection failed. Try direct connection test..."
    echo ""
    
    python3 << 'PYTHON2'
import asyncio
import asyncpg

async def test_direct():
    try:
        print("Testing direct connection...")
        conn = await asyncpg.connect(
            host='db.zymlhofsintkycruwznc.supabase.co',
            port=5432,
            user='postgres.zymlhofsintkycruwznc',
            password='Bichon55!!??',
            database='postgres',
            statement_cache_size=0,
            timeout=10
        )
        version = await conn.fetchval('SELECT version()')
        print(f"✅ SUCCESS! Connected to: {version[:50]}...")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

asyncio.run(test_direct())
PYTHON2
fi
