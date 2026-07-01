"""
Classifies the user's request into a content_type using the LLM itself,
so phrasing variations ("make me a reel", "I need a TikTok script",
"turn this into a short clip") are understood as intent rather than
requiring an exact keyword match.

Falls back to simple keyword matching only if the classification call
fails or returns something unparseable -- so the agent degrades
gracefully instead of crashing.
"""
import json
import logging

from llm_client import llm

logger = logging.getLogger(__name__)

VALID_TYPES = {
    "BLOG", "CAPTION", "HASHTAGS", "VIDEO_SCRIPT",
    "PRESENTATION", "REPURPOSING", "IMAGE",
}

CLASSIFY_PROMPT = """
Classify what kind of content the user is asking for.

User request:
"{query}"

Choose exactly ONE of these labels:
- BLOG: a blog post or written article
- CAPTION: a social media caption (Instagram/Facebook/etc), with hashtags
- HASHTAGS: only hashtags, no caption text
- VIDEO_SCRIPT: a short video, reel, TikTok, or YouTube script
- PRESENTATION: presentation slides / PPT deck
- REPURPOSING: turning existing content into multiple social formats
- IMAGE: generating a picture, illustration, or graphic

Return ONLY valid JSON, no explanation, in this exact shape:
{{"content_type": "ONE_OF_THE_LABELS_ABOVE"}}
"""


def _keyword_fallback(query: str) -> str:
    """Fast, dependency-free fallback if the LLM classification call fails."""
    if "hashtag" in query and "caption" not in query:
        return "HASHTAGS"
    if "caption" in query:
        return "CAPTION"
    if "image" in query or "picture" in query or "photo" in query or "illustration" in query:
        return "IMAGE"
    if "script" in query or "video" in query or "reel" in query:
        return "VIDEO_SCRIPT"
    if "presentation" in query or "ppt" in query or "slides" in query:
        return "PRESENTATION"
    if "repurpose" in query:
        return "REPURPOSING"
    return "BLOG"


def planner(state):
    query = state.get("request", "").lower().strip()

    if not query:
        state["content_type"] = "BLOG"
        state["error"] = "Empty request."
        return state

    try:
        response = llm.invoke(CLASSIFY_PROMPT.format(query=query))
        raw = response.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(raw)
        content_type = str(parsed.get("content_type", "")).upper()

        if content_type not in VALID_TYPES:
            raise ValueError(f"Unrecognized content_type: {content_type!r}")

        state["content_type"] = content_type
        state["error"] = None

    except Exception as e:
        logger.warning(f"LLM classification failed ({e}); falling back to keyword matching.")
        state["content_type"] = _keyword_fallback(query)
        state["error"] = None

    return state