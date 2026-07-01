import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from openai import OpenAI

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Explicit path instead of relying on the process's current working directory --
# uvicorn's reloader/subprocess can sometimes launch from a different cwd on
# Windows, which makes a bare load_dotenv() silently find nothing.
_env_path = Path(__file__).resolve().parent / ".env"
logger.info(f"Looking for .env at: {_env_path}")
logger.info(f".env file exists: {_env_path.exists()}")

load_dotenv(dotenv_path=_env_path)

logger.info(f"GROQ_API_KEY loaded: {bool(os.getenv('GROQ_API_KEY'))}")
logger.info(f"OPENAI_API_KEY loaded: {bool(os.getenv('OPENAI_API_KEY'))}")

# Single shared Groq client for all text-generation agents (planner, writer,
# reviewer, followup, refine). Centralized here so model/temperature/max_tokens
# stay consistent instead of drifting between files.
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=4096,  # avoids silent truncation on Long blogs / 12-15 slide decks
)

# Single shared OpenAI client for image generation.
# Passed explicitly (instead of relying on OpenAI()'s auto-detection) so a
# missing/misnamed env var fails loudly here rather than inside a request.
_openai_key = os.getenv("OPENAI_API_KEY")
if not _openai_key:
    raise RuntimeError(
        "OPENAI_API_KEY is not set. Add it to your .env file "
        "(e.g. OPENAI_API_KEY=sk-...) -- required for image generation."
    )

image_client = OpenAI(api_key=_openai_key)