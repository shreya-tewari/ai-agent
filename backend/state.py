from typing import TypedDict, List, Optional


class AgentState(TypedDict, total=False):
    # ---- input (set by the caller) ----
    request: str
    tone: str
    length: str
    language: str
    image_size: str  # "Square" | "Landscape" | "Portrait" (IMAGE type only)

    # ---- routing (set by planner) ----
    content_type: str  # BLOG | CAPTION | HASHTAGS | VIDEO_SCRIPT | PRESENTATION | REPURPOSING | IMAGE

    # ---- output (set by writer / reviewer) ----
    content: str                    # final text content (polished, if reviewer ran)
    draft_content: str              # pre-review text, kept for debugging/comparison
    caption: str                    # CAPTION type only
    hashtags: List[str]             # CAPTION type only
    image_base64: Optional[str]     # IMAGE type only

    # ---- error handling ----
    error: Optional[str]