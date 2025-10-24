"""
AVA API - Main entry point
"""
from pathlib import Path
from dotenv import load_dotenv

# Load .env file before any imports
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

from api.src.core.app import create_app

app = create_app()
