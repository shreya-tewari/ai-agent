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
#
# This is OPTIONAL at import time. Previously a missing OPENAI_API_KEY raised
# a RuntimeError here, which crashed the entire app on boot -- meaning blogs,
# captions, hashtags, presentations, etc. (none of which need OpenAI) were
# also unavailable just because the image feature's key wasn't configured.
#
# Now: if the key is missing, we log a warning and set image_client to None.
# Only the IMAGE content type (in agents/content.py) checks for None and
# fails gracefully at request time, instead of the whole server refusing to start.
_openai_key = os.getenv("OPENAI_API_KEY")

if not _openai_key:
    logger.warning(
        "OPENAI_API_KEY is not set. Image generation will be unavailable, "
        "but other content types (blog, caption, hashtags, video script, "
        "presentation, repurposing) will work normally."
    )
    image_client = None
else:
    image_client = OpenAI(api_key=_openai_key)