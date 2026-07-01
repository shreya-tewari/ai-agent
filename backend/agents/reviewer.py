import logging

from llm_client import llm

logger = logging.getLogger(__name__)

# Content types whose output is either structured (CAPTION's JSON), too
# short to meaningfully "review" (HASHTAGS), or not text at all (IMAGE).
# Running a prose-polish prompt on these would corrupt the format.
_SKIP_REVIEW_TYPES = {"IMAGE", "CAPTION", "HASHTAGS"}


def reviewer(state):
    content_type = state.get("content_type")
    content = state.get("content")

    if content_type in _SKIP_REVIEW_TYPES or not content or state.get("error"):
        return state

    prompt = f"""
Improve the following content.

Requirements:
- Keep the same meaning and structure
- Professional tone
- Better readability
- Better grammar
- Preserve markdown headings and formatting exactly (# ## - etc.)

Content:
{content}

Return only the final improved content, nothing else.
"""

    try:
        response = llm.invoke(prompt)
        state["draft_content"] = content  # keep pre-review version for comparison
        state["content"] = response.content.strip()
        state["error"] = None
    except Exception as e:
        # If review fails, keep the writer's original output rather than losing it.
        logger.error(f"Reviewer failed, keeping unreviewed content: {e}")

    return state