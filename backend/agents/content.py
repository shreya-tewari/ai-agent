import re
import json
import logging

from llm_client import llm, image_client

logger = logging.getLogger(__name__)

# Length -> concrete numbers, resolved in Python instead of asking the
# model to interpret conditional text like "If Length = Short: 500-700 words".
WORD_COUNTS = {
    "Short": "500-700 words",
    "Medium": "800-1200 words",
    "Long": "1500-2500 words",
}

SLIDE_COUNTS = {
    "Short": "5 slides",
    "Medium": "8 slides",
    "Long": "12-15 slides",
}

CAPTION_LINE_COUNTS = {
    "Short": "2-3 lines",
    "Medium": "5-8 lines",
    "Long": "10-15 lines",
}

IMAGE_SIZES = {
    "Square": "1024x1024",
    "Landscape": "1536x1024",
    "Portrait": "1024x1536",
}


def _clean_markdown_fences(text: str) -> str:
    """Strip any accidental ```lang ... ``` fences, not just ```markdown."""
    text = text.strip()
    text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    return text.strip()


def _build_prompt(content_type, request, tone, length, language):
    if content_type == "BLOG":
        return f"""
Write a blog in {language}.
Topic: {request}
Tone: {tone}
Target length: {WORD_COUNTS.get(length, WORD_COUNTS["Medium"])}

FACTUAL ACCURACY RULES (important):
- Do NOT invent specific statistics, dates, study names, or named sources
  unless you are confident they are well-established and widely known.
- Prefer general, defensible statements over fabricated precision
  (e.g. "many businesses report..." rather than a made-up "73% of businesses").
- If a claim would normally need a citation to be trustworthy, phrase it
  generally instead of stating it as a specific verified fact.

IMPORTANT:
The first line MUST start with #
Example:
# Blog Title
## Introduction
Paragraph
## Main Section 1
Paragraph
## Main Section 2
Paragraph
## Key Benefits
- Point 1
- Point 2
- Point 3
## Conclusion
Paragraph

Return ONLY markdown.
"""

    if content_type == "HASHTAGS":
        return f"""
Generate exactly 10 relevant hashtags for the following topic.
Topic: {request}
Language: {language}

Output format MUST be exactly:
#tag1
#tag2
#tag3
#tag4
#tag5
#tag6
#tag7
#tag8
#tag9
#tag10

Return ONLY the hashtags, nothing else.
"""

    if content_type == "CAPTION":
        return f"""
You MUST generate a JSON object with two fields: "caption" and "hashtags".

"caption": an engaging, {tone.lower()} social media caption about the topic
below, written in {language}, with length matching this rule:
{CAPTION_LINE_COUNTS.get(length, CAPTION_LINE_COUNTS["Medium"])}.

"hashtags": an array of exactly 10 relevant hashtag strings (including #).

Topic: {request}

Return ONLY valid JSON, no markdown fences, no explanation. Example shape:
{{"caption": "...", "hashtags": ["#tag1", "#tag2"]}}
"""

    if content_type == "VIDEO_SCRIPT":
        return f"""
Create a short video script.
Topic: {request}
Language: {language}
Tone: {tone}
Return ONLY the script.
Format:
HOOK:
MAIN CONTENT:
CTA:
"""

    if content_type == "PRESENTATION":
        return f"""
Create presentation slides.
Topic: {request}
Language: {language}
Tone: {tone}
Slide count: {SLIDE_COUNTS.get(length, SLIDE_COUNTS["Medium"])}

Return ONLY slides.
Format:
# Slide 1: Title
- Point 1
- Point 2
# Slide 2
- Point 1
- Point 2
"""

    if content_type == "REPURPOSING":
        return f"""
Repurpose the following content.
Content: {request}
Language: {language}
Tone: {tone}
Return ONLY:
# LinkedIn Post
(content)
# Instagram Caption
(content)
# Twitter/X Post
(content)
No explanation.
"""

    # DEFAULT
    return f"""
Generate content in {language}.
Tone: {tone}
Topic: {request}
Return ONLY final content.
"""


def _generate_image(state):
    """
    IMAGE content type doesn't go through the text LLM at all — it calls
    an image generation model instead and returns base64 image data.
    """
    # Guard: image_client is None if OPENAI_API_KEY wasn't configured.
    # Fail gracefully here instead of crashing the whole server at import
    # time (see llm_client.py for details).
    if image_client is None:
        logger.error("Image generation requested but OPENAI_API_KEY is not configured.")
        state["image_base64"] = None
        state["content"] = ""
        state["error"] = (
            "Image generation is not available: OPENAI_API_KEY is not configured "
            "on the server. Other content types (blog, caption, hashtags, etc.) "
            "are unaffected."
        )
        return state

    request = state.get("request", "")
    size_key = state.get("image_size", "Square")
    size = IMAGE_SIZES.get(size_key, IMAGE_SIZES["Square"])

    try:
        result = image_client.images.generate(
            model="gpt-image-1",
            prompt=request,
            size=size,
            n=1,
        )
        state["image_base64"] = result.data[0].b64_json
        state["content"] = ""
        state["error"] = None
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        state["image_base64"] = None
        state["content"] = ""
        state["error"] = f"Image generation failed: {e}"

    return state


def content_agent(state):
    content_type = state.get("content_type", "DEFAULT").strip().upper()
    request = state.get("request", "")
    tone = state.get("tone", "Professional")
    length = state.get("length", "Medium")
    language = state.get("language", "English")

    logger.info(f"Content type: {content_type}")

    if not request:
        state["content"] = ""
        state["error"] = "Missing 'request' in state."
        return state

    if content_type == "IMAGE":
        return _generate_image(state)

    prompt = _build_prompt(content_type, request, tone, length, language)

    try:
        response = llm.invoke(prompt)
        final_output = _clean_markdown_fences(response.content)
    except Exception as e:
        logger.error(f"Content generation failed: {e}")
        state["content"] = ""
        state["error"] = f"Content generation failed: {e}"
        return state

    if content_type == "CAPTION":
        try:
            parsed = json.loads(final_output)
            state["caption"] = parsed.get("caption", "")
            state["hashtags"] = parsed.get("hashtags", [])
            state["content"] = final_output
        except json.JSONDecodeError:
            logger.warning("CAPTION output was not valid JSON; returning raw text.")
            state["content"] = final_output
        state["error"] = None
        return state

    state["content"] = final_output
    state["error"] = None
    return state