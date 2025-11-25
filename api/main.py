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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=5555, reload=True)
