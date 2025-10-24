"""
Test configuration and fixtures - DIVINE Testing
"""
import os
import sys
from pathlib import Path

# Set test environment variables BEFORE any imports
os.environ["AVA_API_DATABASE_URL"] = "postgresql+asyncpg://nissielberrebi@localhost:5432/avaai_test"
os.environ["AVA_API_ENVIRONMENT"] = "test"
os.environ["AVA_API_LOG_LEVEL"] = "DEBUG"
os.environ["AVA_API_JWT_SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["AVA_API_VAPI_API_KEY"] = "test_vapi_key"

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
